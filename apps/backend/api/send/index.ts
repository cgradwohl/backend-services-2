import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { IBrand } from "~/lib/brands/types";
import {
  translateAndDeliverBooleanCount,
  translateAndVerifyBooleanCount,
} from "~/lib/courier-emf/logger-metrics-utils";
import {
  create as createLogEntry,
  createRequestReceivedEvent,
  EntryTypes,
} from "~/lib/dynamo/event-logs";
import { create as createMessageItem } from "~/lib/dynamo/messages";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import { NotFound } from "~/lib/http-errors";
import getIdempotencyKeyHeader from "~/lib/idempotent-requests/get-header";
import {
  ApiRequestContext,
  assertBody,
  getRequestHeader,
  handleIdempotentApi,
} from "~/lib/lambda-response";
import { CourierLogger } from "~/lib/logger";
import jsonStore from "~/lib/s3";
import createTraceId from "~/lib/x-ray/create-trace-id";
import overflowService from "~/overflow/service";
import { OverflowMessage } from "~/overflow/types";
import { actionService, requestService } from "~/send/service";
import { IRequestAction } from "~/send/types";
import { S3PrepareMessage, SqsPrepareMessage } from "~/types.internal";
import * as PublicTypes from "~/types.public";
import { handleV2Request } from "./handle-v2-request";
import { assertOptionalJsonField } from "./lib/assert-optional-json-field";
import getBrand from "./lib/get-brand";
import getLatestBrand from "./lib/get-latest-brand";
import {
  RequestTranslationError,
  translateRequest,
} from "./lib/translate-request";
import { RequestV2 } from "./types";

const enqueuePrepare = enqueueByQueueUrl<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_URL
);

const { put: putMessageObject } = jsonStore<S3PrepareMessage>(
  process.env.S3_MESSAGES_BUCKET
);
interface ICreateMessage {
  idempotencyKey: string;
  messageId: string;
  messageObject: S3PrepareMessage;
  tenantId: string;
  source: string;
}
export const createMessage = async ({
  idempotencyKey,
  messageId,
  messageObject,
  tenantId,
  source,
}: ICreateMessage) => {
  await createMessageItem(
    tenantId,
    messageObject.eventId,
    messageObject.recipientId,
    messageId,
    undefined,
    undefined,
    undefined,
    { idempotencyKey, source }
  );

  await putMessageObject(
    getPrepareFilePath(tenantId, messageId),
    messageObject
  );
};

export const getPrepareFilePath = (tenantId: string, messageId: string) =>
  `${tenantId}/prepare_${messageId}.json`;

export const saveAndEnqueue = async (
  messageId: string,
  tenantId: string,
  message: S3PrepareMessage,
  options: {
    filename?: string;
  } = {}
) => {
  const filename = options.filename || `prepare_${messageId}`;
  const filePath = `${tenantId}/${filename}.json`;

  await putMessageObject(filePath, message);

  const overflow = overflowService(tenantId);
  const overflowTenant = overflow.isOverflowTenant(message.eventId);

  if (overflowTenant) {
    const overflowMessage = new OverflowMessage({
      created: new Date().toISOString(),
      filePath,
      messageId,
      tenantId,
    });

    await overflow.create(overflowMessage);
  } else {
    await enqueuePrepare({
      messageId,
      messageLocation: {
        path: filePath,
        type: "S3",
      },
      tenantId,
      type: "prepare",
    });
  }
};

export const getScopedBrand = async (
  tenantId: string,
  id: string,
  state: "published" | "draft" | "submitted",
  useMaterializedBrands: boolean
) =>
  ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getBrand(tenantId, id, useMaterializedBrands, {
        extendDefaultBrand: true,
      })
    : getLatestBrand(tenantId, id, useMaterializedBrands);

const apiError = (
  message: string,
  status: number = 400
): PublicTypes.IApiError => {
  return {
    body: {
      message,
      status,
    },
    status,
  };
};

const validateAndFormatV1Request = async (
  context
): Promise<{
  error?: PublicTypes.IApiError;
  messageObject?: S3PrepareMessage;
  request?: PublicTypes.ApiSendRequest;
  tenantId?: string;
}> => {
  const body = assertBody<PublicTypes.ApiSendRequest>(context);
  const tenantId = context.tenantId;
  const scope = context.scope;
  const dryRunKey = context.dryRunKey;
  const useMaterializedBrands = context.useMaterializedBrands;

  const brandId = body.brand;
  const eventId = body.event;
  const recipientId = body.recipient;

  const eventData = assertOptionalJsonField(body, "data");
  const eventPreferences = assertOptionalJsonField(body, "preferences");
  const eventProfile = assertOptionalJsonField(body, "profile");
  const override = assertOptionalJsonField(body, "override");

  if (!recipientId) {
    return {
      error: apiError("The 'recipient' parameter is required."),
    };
  }

  if (typeof recipientId !== "string") {
    return {
      error: apiError("The 'recipient' parameter must be a string."),
    };
  }

  if (!eventId) {
    return {
      error: apiError("The 'event' parameter is required."),
    };
  }

  if (typeof eventId !== "string") {
    return {
      error: apiError("The 'event' parameter must be a string."),
    };
  }

  const [state] = scope.split("/");
  assertStateIsValid(state);

  // valid brand required
  let brand: IBrand;
  if (brandId) {
    try {
      brand = await getScopedBrand(
        tenantId,
        brandId,
        state,
        useMaterializedBrands
      );
    } catch (e) {
      if (e instanceof NotFound) {
        return {
          error: apiError(`Invalid brand (${brandId})`, 422),
        };
      }
      throw e;
    }

    if (!brand) {
      return {
        error: apiError(`Invalid brand (${brandId})`, 422),
      };
    }

    if (!brand.published && ["published", "submitted"].includes(state)) {
      // brand must be published
      return {
        error: apiError(`Brand (${brandId}) not published`, 422),
      };
    }
  }

  const messageObject: S3PrepareMessage = {
    brand,
    ...(body?.routing && { routing: body.routing }),
    dryRunKey,
    eventData,
    eventId,
    eventPreferences,
    eventProfile,
    override,
    recipientId,
    scope,
  };

  return {
    messageObject,
    request: {
      ...body,
      ...(eventData ? { data: eventData } : undefined),
      ...(eventPreferences ? { preferences: eventPreferences } : undefined),
      ...(eventProfile ? { profile: eventProfile } : undefined),
      ...(override ? { override } : undefined),
    },
    tenantId,
  };
};

interface IV1Record {
  idempotencyKey: string;
  messageId: string;
  messageObject: S3PrepareMessage;
  request: PublicTypes.ApiSendRequest;
  tenantId: string;
  source?: string;
  shouldVerifyRequestTranslation?: boolean;
}

export const putV1 = async ({
  idempotencyKey,
  messageId,
  messageObject,
  request,
  tenantId,
  source,
  shouldVerifyRequestTranslation = false,
}: IV1Record) => {
  await createMessage({
    tenantId,
    messageId,
    idempotencyKey,
    messageObject,
    source,
  });
  await createRequestReceivedEvent({
    tenantId,
    requestId: messageId,
    request,
  });

  const overflow = overflowService(tenantId);
  const overflowTenant = overflow.isOverflowTenant(messageObject.eventId);

  if (shouldVerifyRequestTranslation !== true && overflowTenant) {
    const overflowMessage = new OverflowMessage({
      created: new Date().toISOString(),
      filePath: getPrepareFilePath(tenantId, messageId),
      messageId,
      tenantId,
    });

    await overflow.create(overflowMessage);
    return;
  } else {
    await enqueuePrepare({
      messageId,
      messageLocation: {
        path: getPrepareFilePath(tenantId, messageId),
        type: "S3",
      },
      tenantId,
      shouldVerifyRequestTranslation,
      type: "prepare",
    });
    return;
  }
};

export const handleSendRequest = async ({
  context,
  messageId,
}: {
  context: ApiRequestContext;
  messageId: string;
}) => {
  await Promise.all([
    translateAndVerifyBooleanCount({
      messageId,
      translateToV2: context?.translateToV2,
    }),

    translateAndDeliverBooleanCount({
      messageId,
      shouldTranslateAndDeliver: context?.shouldTranslateAndDeliver,
    }),
  ]);

  const { error, messageObject, request, tenantId } =
    await validateAndFormatV1Request(context);

  if (error) {
    return error;
  }

  const idempotencyKey = getIdempotencyKeyHeader(context);
  const source = getRequestHeader(context, "X-COURIER-SOURCE");

  if (context?.shouldTranslateAndDeliver === true) {
    const { apiVersion, dryRunKey, scope } = context;

    await createRequestReceivedEvent({
      tenantId,
      requestId: messageId,
      request,
    });

    try {
      const translated = await translateRequest({
        request,
        tenantId,
        traceId: messageId,
      });

      const { filePath } = await requestService(tenantId).create({
        apiVersion,
        dryRunKey,
        idempotencyKey,
        request: translated,
        requestId: messageId, // messageId is AWS-Trace-Id
        scope,
        source,
        translated: true,
      });

      await actionService(tenantId).emit<IRequestAction>({
        command: "request",
        apiVersion,
        dryRunKey,
        requestFilePath: filePath,
        requestId: messageId, // messageId is AWS-Trace-Id
        scope,
        source,
        tenantId,
        translated: true,
      });

      return;
    } catch (error) {
      const { logger } = new CourierLogger("Translate and Deliver Error");

      logger.error(error);

      // if RequestTranslation failed then deliver the message through V1
      // if this fails, then a 500 will be returned to the user
      await putV1({
        idempotencyKey,
        messageId,
        messageObject,
        request: {
          ...request,
          v1TranslationErrorFallback: true,
        },
        tenantId,
        source,
      });

      return;
    }
  }

  if (context?.translateToV2 === true) {
    const { apiVersion, dryRunKey, scope } = context;

    try {
      const translated = await translateRequest({
        request,
        tenantId,
        traceId: messageId,
      });

      const { filePath } = await requestService(tenantId).create({
        apiVersion,
        dryRunKey,
        idempotencyKey,
        request: translated,
        requestId: messageId, // messageId is AWS-Trace-Id
        scope,
        source,
      });

      await actionService(tenantId).emit<IRequestAction>({
        command: "request",
        apiVersion,
        dryRunKey,
        requestFilePath: filePath,
        requestId: messageId, // messageId is AWS-Trace-Id
        scope,
        source,
        tenantId,
        shouldVerifyRequestTranslation: context?.translateToV2,
      });

      // put V1 request for delivery
      // at this point we are only verifying rendered output and not passing the translated request
      await putV1({
        idempotencyKey,
        messageId,
        messageObject,
        request,
        tenantId,
        source,
        shouldVerifyRequestTranslation: context?.translateToV2, // true
      });

      return;
    } catch (error) {
      const { logger } = new CourierLogger("Translate and Verify Error");

      logger.error(error);

      // if RequestTranslation failed then deliver the message through V1
      // if this fails, then a 500 will be returned to the user
      await putV1({
        idempotencyKey,
        messageId,
        messageObject,
        request: {
          ...request,
          v1TranslationErrorFallback: true,
        },
        tenantId,
        source,
      });

      return;
    }
  }

  if (context?.translateToV2 === false) {
    await putV1({
      idempotencyKey,
      messageId,
      messageObject,
      request,
      tenantId,
      source,
    });
  }
};

export const send = handleIdempotentApi<PublicTypes.ApiSendResponse>(
  async (context) => {
    const traceId = createTraceId();
    const body = assertBody<PublicTypes.ApiSendRequest | RequestV2>(context);
    const request = body as RequestV2;

    if (request?.message ?? request?.sequence) {
      await handleV2Request({ context, traceId });

      return {
        body: {
          requestId: traceId,
        },
        status: 202,
      };
    }

    const error = await handleSendRequest({ context, messageId: traceId });
    if (error) {
      return error;
    }

    return {
      body: {
        messageId: traceId,
      },
    };
  }
);
