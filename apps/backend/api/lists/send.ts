import { nanoid } from "nanoid";

import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { get as getBrand, getLatest } from "~/lib/brands";
import { IBrand } from "~/lib/brands/types";
import { assertValidDataSourceConfig } from "~/lib/data-source/assert-valid-data-source-config";
import { InvalidDataSourceConfigError } from "~/lib/data-source/errors";
import enqueue from "~/lib/enqueue";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertBody, handleIdempotentApi } from "~/lib/lambda-response";
import { assertValidPattern } from "~/lib/lists";
import { get as getList } from "~/lib/lists";
import { InvalidListSearchPatternError } from "~/lib/lists/errors";
import { IListItem } from "~/lib/lists/types";
import parseJsonObject from "~/lib/parse-json-object";
import jsonStore from "~/lib/s3";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { JSONObject } from "~/types.api";
import {
  S3SendListOrPatternMessage,
  SqsSendListOrPatternMessage,
  TenantRouting,
  TenantScope,
} from "~/types.internal";
import {
  ApiSendListOrPatternRequest,
  ApiSendRequestOverride,
  ApiSendResponse,
  IProfilePreferences,
} from "~/types.public";

const enqueueSendListOrPatternMessage = enqueue<SqsSendListOrPatternMessage>(
  process.env.SQS_SEND_LIST_OR_PATTERN_QUEUE_NAME
);

const { put: putListOrPatternMessage } = jsonStore<S3SendListOrPatternMessage>(
  process.env.S3_MESSAGES_BUCKET
);

// send/list supports sending a list or a pattern that can match 1+ list(s)
// used in SendListOrPattern trigger as well
export const ListSendTypes = {
  list: "send-list",
  pattern: "send-pattern",
};

const saveAndEnqueue = async (
  messageId: string,
  tenantId: string,
  message: S3SendListOrPatternMessage,
  originalMessageId: string
) => {
  const type = message.list?.id ? ListSendTypes.list : ListSendTypes.pattern;
  const filePath = `${tenantId}/${type}-${nanoid()}.json`;
  // we use the original message id for lists to tie each event log
  // to the original list send. patterns will not appear in logs,
  // hence not worrying about standardizing on the originalMessageId
  const resolvedMessageId = originalMessageId ?? messageId;

  // save to s3
  await putListOrPatternMessage(filePath, message);

  // enqueue message
  await enqueueSendListOrPatternMessage({
    messageId,
    messageLocation: {
      path: filePath,
      type: "S3",
    },
    originalMessageId: resolvedMessageId,
    tenantId,
    type,
  });
};

const getScopedBrand = async (
  tenantId: string,
  id: string,
  state: "published" | "draft" | "submitted"
) =>
  ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getBrand(tenantId, id, {
        extendDefaultBrand: true,
      })
    : getLatest(tenantId, id);

export const sendListOrPattern = async (
  body: ApiSendListOrPatternRequest,
  brand: IBrand,
  eventData: JSONObject,
  eventId: string,
  messageId: string,
  override: ApiSendRequestOverride,
  tenantId: string,
  list?: IListItem,
  pattern?: string,
  originalMessageId?: string,
  dryRunKey?: TenantRouting,
  scope?: TenantScope,
  eventPreferences?: IProfilePreferences
) => {
  const message: S3SendListOrPatternMessage = {
    brand,
    dataSource: body.data_source,
    dryRunKey,
    eventData,
    eventId,
    eventPreferences,
    list,
    override,
    pattern,
    scope,
  };
  await saveAndEnqueue(messageId, tenantId, message, originalMessageId);
};

export const handleListOrPatternSendRequest = async ({
  context,
  messageId,
}) => {
  const tenantId = context.tenantId;
  const dryRunKey = context.dryRunKey;
  const scope = context.scope;
  const body = assertBody<ApiSendListOrPatternRequest>(context);
  const brandId = body.brand;
  const eventId = body.event;
  const eventData = parseJsonObject(body.data);
  const eventPreferences = parseJsonObject<IProfilePreferences>(
    body.preferences
  );
  const override = parseJsonObject<ApiSendRequestOverride>(body.override);
  const pattern = body.pattern;
  const listId = body.list;
  const dataSource = body.data_source;

  if (!eventId) {
    throw new BadRequest("The 'event' parameter is required.");
  }

  if (typeof eventId !== "string") {
    throw new BadRequest("The 'event' parameter must be a string.");
  }

  if (eventData === null) {
    throw new BadRequest("The 'data' parameter must be valid JSON.");
  }

  // must have one of listId || pattern, but not both
  if (!listId && !pattern) {
    throw new BadRequest("Either 'list' or 'pattern' parameter is required.");
  }

  if (listId && pattern) {
    throw new BadRequest(
      "Only one of the following properties allowed: 'list', 'pattern'"
    );
  }

  if (pattern) {
    try {
      assertValidPattern(pattern);
    } catch (e) {
      // need to handle these validations to ensure they return as 400s
      if (e instanceof InvalidListSearchPatternError) {
        throw new BadRequest(e.message);
      }
    }
  }

  if (dataSource) {
    try {
      assertValidDataSourceConfig(dataSource);
    } catch (e) {
      // need to handle these validations to ensure they return as 400s
      if (e instanceof InvalidDataSourceConfigError) {
        throw new BadRequest(e.message);
      }
    }
  }

  const [state] = scope.split("/");
  assertStateIsValid(state);

  // valid brand required
  let brand: IBrand;
  if (brandId) {
    try {
      brand = await getScopedBrand(tenantId, brandId, state);
    } catch (err) {
      if (err instanceof NotFound) {
        throw new BadRequest(`Invalid brand (${brandId})`);
      }
      throw err;
    }

    if (!brand) {
      throw new BadRequest(`Invalid brand (${brandId})`);
    }

    if (!brand.published && ["published", "submitted"].includes(state)) {
      // brand must be published
      throw new BadRequest(`Brand (${brandId}) not published`);
    }
  }

  // valid list required
  let list: IListItem;
  if (listId) {
    try {
      list = await getList(tenantId, listId);
      if (!list?.id) {
        throw new BadRequest(`Cannot send to archived list (${listId})`);
      }
    } catch (err) {
      if (err instanceof NotFound) {
        throw new BadRequest(`Invalid list (${listId})`);
      }
      throw err;
    }
    // To prevent double sanitization
    list.id = listId;
  }

  await sendListOrPattern(
    body,
    brand,
    eventData,
    eventId,
    messageId,
    override,
    tenantId,
    list,
    pattern,
    undefined,
    dryRunKey,
    scope,
    eventPreferences
  );
};

export const handle = handleIdempotentApi<ApiSendResponse>(async (context) => {
  const messageId = createTraceId();

  await handleListOrPatternSendRequest({ context, messageId });

  return { body: { messageId } };
});
