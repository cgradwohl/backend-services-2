import KoaRouter from "koa-router";
import { RequestV2 } from "~/api/send/types";
import { validateV2RequestHardcoded } from "~/api/send/validation/validate-v2-request-hardcoded";

import assertHasCapability, {
  CapabilityAssertionError,
} from "~/lib/access-control/assert-has-capability";
import { toApiKey } from "~/lib/api-key-uuid";
import { assertValidScope } from "~/lib/assertions/is-valid-scope-state";
import { get as getBrand } from "~/lib/brands";
import { IBrand } from "~/lib/brands/types";
import {
  create as createLogEntry,
  createArchivedEvent,
  EntryTypes,
  getLogs,
  getReceived as getEventInput,
} from "~/lib/dynamo/event-logs";
import { create as createMessage } from "~/lib/dynamo/messages";
import {
  BadCursor,
  search as searchMessages,
} from "~/lib/elastic-search/messages";
import enqueue from "~/lib/enqueue";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import getTenantInfo from "~/lib/get-tenant-info";
import { BadRequest, NotFound } from "~/lib/http-errors";
import logger from "~/lib/logger";
import service from "~/lib/message-service";
import truncateLargeStrings from "~/lib/truncate-long-strings";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { actionService, requestService } from "~/send/service";
import { IAcceptAction, IRequestAction } from "~/send/types";
import { IEventLogEntry } from "~/types.api";
import { SqsPrepareMessage } from "~/types.internal";
import { list as listMessages } from "../lib/dynamo/messages";
import requireCapabilityMiddleware from "./middleware/require-capability";

const enqueuePrepare = enqueue<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_NAME
);

const sortByEnqueued = (a: IEventLogEntry, b: IEventLogEntry) => {
  return a.timestamp > b.timestamp ? 1 : -1;
};

const filterAWSHeaders = (headers: { [header: string]: string }) => {
  return Object.keys(headers).reduce(
    (filteredHeaders: { [header: string]: string }, header) => {
      const lowercaseHeader = header.toLowerCase();
      if (
        lowercaseHeader.startsWith("cloudfront-") ||
        lowercaseHeader.startsWith("x-amz") ||
        lowercaseHeader.startsWith("x-forwarded-")
      ) {
        return filteredHeaders;
      }
      filteredHeaders[header] = headers[header];
      return filteredHeaders;
    },
    {}
  );
};

const parseProviderResponse = (log: IEventLogEntry) => {
  if (log.type !== "provider:error" || !log.json.providerResponse) {
    return log;
  }

  try {
    const { providerResponse } = log.json;

    log.json = {
      ...log.json,
      providerResponse: JSON.parse(providerResponse),
    };
  } catch (err) {
    // JSON.parse() failed so just return as-is
  }

  return log;
};

const messages = new KoaRouter();

messages.get("/", async (context) => {
  try {
    const { role } = context.userContext;
    const environment = context.params?.environment ?? "production";
    assertHasCapability(role, "message:ListItems", `${environment}/*`);
  } catch (err) {
    context.body = { messages: [] };
    return;
  }

  const {
    at: atToken,
    hasError,
    jobId,
    notificationId,
    providers: providersString,
    recipient,
    recipientEmail,
    recipientId,
    start: startString,
    status: statusString,
    statuses: statusesString,
    traceId,
  } = context.request.query;
  const { tenantId } = context.userContext;
  let { limit } = context.request.query;
  limit = limit && Number(limit);
  const start =
    startString && !isNaN(parseInt(startString, 10))
      ? parseInt(startString, 10)
      : undefined;

  const providers = providersString ? providersString.split(",") : undefined;
  let statuses = statusesString ? statusesString.split(",") : undefined;

  // backward compatability 11/8/19
  if (statusString) {
    statuses = [statusString];
  }

  const prev = context.request.query.prev || undefined;
  const next = context.request.query.next || undefined;

  try {
    const loadMessagesFromDynamo = await getFeatureTenantVariation(
      "load-messages-from-dynamo",
      tenantId
    );

    if (loadMessagesFromDynamo) {
      const items = await listMessages({
        limit,
        next,
        tenantId,
      });

      context.body = items;
      return;
    }
    const items = await searchMessages({
      at: atToken,
      hasError,
      jobId,
      limit,
      next,
      notificationId,
      prev,
      providers,
      recipient,
      recipientEmail,
      recipientId,
      start,
      statuses,
      tenantId,
      traceId,
    });

    context.body = items;
  } catch (err) {
    if (err instanceof BadCursor) {
      throw new BadRequest("Invalid cursor");
    }

    throw err;
  }
});

messages.get(
  "/:messageId",
  requireCapabilityMiddleware("message:ReadItem", {
    resourceIdentifier: "messageId",
  }),
  async (context) => {
    const { messageId } = context.params;
    const { tenantId } = context.userContext;

    const [message, logs] = await Promise.all([
      service.getById(context.userContext.tenantId, messageId),
      getLogs(tenantId, messageId),
    ]).catch(() => {
      throw new NotFound(`Message with id (${messageId}) not found`);
    });

    context.body = {
      logs: logs
        ? logs
            .map(({ json, ...rest }) => {
              try {
                const { role } = context.userContext;
                const environment = context.params?.environment ?? "production";
                const resource = `${environment}/${rest.type}`;
                assertHasCapability(role, "message:ReadEventDetails", resource);
              } catch (err) {
                if (err instanceof CapabilityAssertionError) {
                  return {
                    ...rest,
                    json: {},
                  };
                }
                throw err;
              }

              const log = {
                ...rest,
                json:
                  rest.type === "event:received"
                    ? truncateLargeStrings(json)
                    : json,
              };

              if (log.json.clickHeaders) {
                log.json.clickHeaders = filterAWSHeaders(log.json.clickHeaders);
              }

              if (log.json.headers) {
                log.json.headers = filterAWSHeaders(log.json.headers);
              }

              if (log.json.notificationId) {
                // do not leak UUIDs
                log.json.notificationId = toApiKey(log.json.notificationId);
              }

              return log;
            })
            .map(parseProviderResponse)
            .sort(sortByEnqueued)
        : undefined,
      message,
    };
  }
);

messages.post(
  "/:messageId/re-queue",
  requireCapabilityMiddleware("message:RequeueItem", {
    resourceIdentifier: "messageId",
  }),
  async (context) => {
    const oldMessageId = context.params.messageId;
    const { tenantId } = context.userContext;
    const messageId = createTraceId();

    const input = await getEventInput(tenantId, oldMessageId);

    if (input === undefined) {
      throw new NotFound("Input data not found");
    }

    const { body } = input;

    // V2 REQUEST SCHEMA GOES INTO V2 PIPELINE
    if (body?.message) {
      const originalRequest = body as unknown as RequestV2;
      const requestId = createTraceId();

      const { environment } = getTenantInfo(tenantId);
      const scope = `published/${environment}`;
      assertValidScope(scope);

      await validateV2RequestHardcoded(originalRequest, tenantId);

      const { filePath } = await requestService(tenantId).create({
        apiVersion: "2021-11-01",
        idempotencyKey: undefined,
        dryRunKey: undefined,
        request: originalRequest,
        requestId,
        scope,
        source: undefined,
      });

      await actionService(tenantId).emit<IRequestAction>({
        command: "request",
        apiVersion: "2021-11-01",
        dryRunKey: undefined,
        requestFilePath: filePath,
        requestId,
        scope,
        source: undefined,
        tenantId,
      });

      context.body = { messageId };
      return;
    }

    const brandId = body.brand;
    const eventId = body.event;
    const recipientId = body.recipient;

    // if brand specified, must exist
    let brand: IBrand;
    if (brandId) {
      try {
        brand = await getBrand(tenantId, brandId, {
          extendDefaultBrand: true,
        });
      } catch (e) {
        if (e instanceof NotFound) {
          throw new BadRequest(`Invalid brand`);
        }
        throw e;
      }

      if (!brand) {
        return new BadRequest(`Invalid brand`);
      }

      if (!brand.published) {
        // brand must be published
        return new BadRequest(`Brand not published`);
      }
    }

    await createMessage(tenantId, eventId, recipientId, messageId);

    const { environment } = getTenantInfo(tenantId);
    const scope = `published/${environment}`;
    assertValidScope(scope);

    await enqueuePrepare({
      messageId,
      messageLocation: {
        path: {
          brand,
          eventData: body.data,
          eventId,
          eventPreferences: body.preferences,
          eventProfile: body.profile,
          override: body.override,
          recipientId,
          scope,
        },
        type: "JSON",
      },
      tenantId,
      type: "prepare",
    });

    await createLogEntry(tenantId, messageId, EntryTypes.eventReceived, {
      body,
    });

    context.body = { messageId };
  }
);

messages.post(
  "/:messageId/archive",
  requireCapabilityMiddleware("message:WriteItem", {
    resourceIdentifier: "messageId",
  }),
  async (context) => {
    const messageId = context.params.messageId;
    const { tenantId, userId } = context.userContext;

    await createArchivedEvent(tenantId, messageId, {
      userId,
    });

    context.status = 204;
  }
);

export default messages;
