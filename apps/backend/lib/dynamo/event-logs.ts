import { AWSError } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import captureException from "~/lib/capture-exception";
import { decode as decodeEmailSubject } from "~/lib/email-subject-encoding";
import getEnvVar from "~/lib/get-environment-variable";
import { sizeInWriteCapacityUnits } from "~/lib/object-size";
import parseJsonObject from "~/lib/parse-json-object";
import jsonStore from "~/lib/s3";
import eventReprocessor from "~/reprocessors/services/events";
import { IEventReprocessorPayloadInput } from "~/reprocessors/types/events";
import { RequestPayload } from "~/send/service/data/request/request.types";
import {
  EventLogEntryType,
  IEventLogEntry,
  IEventLogEntryJson,
  JSONObject,
} from "~/types.api";
import {
  ChannelDetails,
  ISafeEventLogEntry,
  ITrackingRecord,
} from "~/types.internal";
import * as PublicTypes from "~/types.public";
import generateS3Prefix from "../generate-s3-prefix";
import { MessageStatusReason } from "../message-service/types";
import truncateLargeStrings from "../truncate-long-strings";
import {
  getItem,
  id as createId,
  put as putItem,
  query as queryItem,
} from "./index";

const TableName = getEnvVar("EVENT_LOGS_TABLE_NAME");

const { get: getEventLog, put: putEventLog } = jsonStore<IEventLogEntryJson>(
  getEnvVar("S3_EVENT_LOGS_BUCKET")
);

interface IBody {
  data: JSONObject;
  event: string;
  override: PublicTypes.ApiSendRequestOverride;
  preferences?: PublicTypes.IProfilePreferences;
  profile: JSONObject;
  recipient: string;
}

interface IClickDataPush {
  clickHeaders?: { [key: string]: string };
  clickIp?: string;
  clickUserAgent?: string;
  slackPayload?: any;
  provider?: string;
}

interface IWebhookResponseData {
  headers: { [key: string]: string };
  body: any;
  status: number;
}

export const migrateLegacyEventLogJson = (json: unknown): JSONObject => {
  if (typeof json === "string") {
    return JSON.parse(json) as JSONObject;
  }

  return json as JSONObject;
};

export const getJsonValue = async (
  json: JSONObject
): Promise<IEventLogEntryJson> =>
  json.type === "S3" && typeof json.path === "string"
    ? getEventLog(json.path)
    : json;

const migrateLegacyReceivedValue = (value: {
  [key: string]: any;
}): { body: IBody } => {
  // only new records have a "body" value
  if ("body" in value) {
    return value as { body: IBody };
  }

  const {
    eventData: data,
    eventId: event,
    eventPreferences: preferences,
    eventProfile: profile,
    override,
    recipientId: recipient,
  } = value;

  return {
    body: {
      data,
      event,
      override,
      preferences,
      profile,
      recipient,
    },
  };
};

const handleJsonObjectsInReceived = ({ body }: { body: IBody }) => {
  const { data, preferences, profile } = body;
  return {
    body: {
      ...body,
      data: parseJsonObject(data),
      preferences:
        parseJsonObject<PublicTypes.IProfilePreferences>(preferences),
      profile: parseJsonObject(profile),
    },
  } as {
    body: {
      data: JSONObject;
      preferences: PublicTypes.IProfilePreferences;
      profile: JSONObject;
      [key: string]: any;
    };
  };
};

interface IEntryTypes {
  eventArchived: string;
  eventDelayed: string;
  eventUnread: string;
  eventRead: string;
  eventClick: string;
  eventFiltered: string;
  eventNotificationId: string;
  eventOpened: string;
  eventPrepared: string;
  eventReceived: string;
  eventReceivedSendTopic: string;
  eventRouted: string;
  eventUnmapped: string;
  pollingAttempt: string;
  pollingError: string;
  profileLoaded: string;
  providerAttempt: string;
  providerDelivered: string;
  providerDelivering: string;
  providerError: string;
  providerRendered: string;
  providerSent: string;
  providerSimulated: string;
  retrying: string;
  timedout: string;
  undeliverable: string;
  unroutable: string;
  webhookResponse: string;
}

export const EntryTypes: { [key in keyof IEntryTypes]: EventLogEntryType } = {
  eventArchived: "event:archived",
  eventClick: "event:click",
  eventDelayed: "event:delayed",
  eventFiltered: "event:filtered",
  eventNotificationId: "event:notificationId", // TODO: rename to event:mapped
  eventOpened: "event:opened",
  eventPrepared: "event:prepared",
  eventRead: "event:read",
  eventReceived: "event:received",
  eventReceivedSendTopic: "event:receivedSendTopic",
  eventRouted: "event:routed",
  eventUnmapped: "event:unmapped",
  eventUnread: "event:unread",
  pollingAttempt: "polling:attempt",
  pollingError: "polling:error",
  profileLoaded: "profile:loaded",
  providerAttempt: "provider:attempt",
  providerDelivered: "provider:delivered",
  providerDelivering: "provider:delivering",
  providerError: "provider:error",
  providerRendered: "provider:rendered",
  providerSent: "provider:sent",
  providerSimulated: "provider:simulated",
  retrying: "retrying",
  timedout: "timedout",
  undeliverable: "undeliverable",
  unroutable: "unroutable",
  webhookResponse: "webhook:response",
};

const generateS3FilePath = (event: IEventLogEntry) => {
  const { tenantId, messageId, timestamp, type } = event;
  const filename = `${tenantId}-${messageId}_${type.replace(
    ":",
    "_"
  )}_${timestamp}`;
  const prefix = generateS3Prefix();
  return `${prefix}/${filename}.json`;
};

const writeToDynamo = async (
  event: IEventLogEntry
): Promise<ISafeEventLogEntry> => {
  const item: ISafeEventLogEntry = {
    ...event,
    json: JSON.stringify(event.json),
  };

  // write event log to dynamo
  await putItem({
    Item: item,
    TableName,
  });

  return item;
};

const writeToDynamoAndS3 = async (
  event: IEventLogEntry
): Promise<ISafeEventLogEntry> => {
  const { tenantId, messageId, timestamp, type } = event;
  const filePath = generateS3FilePath(event);

  const item: ISafeEventLogEntry = {
    id: createId(),
    json: {
      path: filePath,
      type: "S3",
    },
    messageId,
    tenantId,
    timestamp,
    type,
  };

  // write event log to s3
  await putEventLog(filePath, event.json);
  // write event log to dynamo
  await putItem({
    Item: item,
    TableName,
  });

  return item;
};

export const create = async (
  tenantId: string,
  messageId: string,
  type: EventLogEntryType,
  json: IEventLogEntryJson,
  ts?: number
): Promise<ISafeEventLogEntry> => {
  const timestamp = ts ?? Date.now();

  try {
    const event: IEventLogEntry = {
      id: createId(),
      json,
      messageId,
      tenantId,
      timestamp,
      type,
    };

    const writeCapacityUnits = sizeInWriteCapacityUnits(event);

    const item =
      writeCapacityUnits > 1
        ? await writeToDynamoAndS3(event)
        : await writeToDynamo(event);

    return item;
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.error(
      `swallow error:- for ${tenantId}/${messageId}:- ${JSON.stringify(err)}`
    );

    // if error is retryable save to the reprocessor
    const isRetryable = !!(err as AWSError).retryable;
    if (isRetryable) {
      // tslint:disable-next-line: no-console
      console.warn(
        `Retryable error detected, saving to the reprocessor:- ${tenantId}/${messageId}/${type}`
      );
      const reprocessor = eventReprocessor();
      await reprocessor.save({
        json,
        messageId,
        tenantId,
        ts: timestamp,
        type,
      } as IEventReprocessorPayloadInput);
    }

    // generate sentry error
    await captureException(err);
    // intentionally swallow error as it should not cause a break in processing
    return null;
  }
};

export const createRequestReceivedEvent = async (params: {
  tenantId: string;
  requestId: string;
  request: PublicTypes.ApiSendRequest | RequestPayload;
}) => {
  const { tenantId, requestId, request } = params;

  /**
   * if the V2 request was translated, then don't create another RequestReceived event.
   *
   * a RequestReceived event was already created in the V1 Code Path in ApiSend, before it was translated.
   */
  if (request?.translated === true) {
    return;
  }

  /**
   * if the V1 -> V2 Translation failed then don't create another RequestReceived event.
   *
   * a RequestReceived event was already created in the V1 Code Path in ApiSend.
   */
  if (
    (request as PublicTypes.ApiSendRequest)?.v1TranslationErrorFallback === true
  ) {
    return;
  }

  if ((request as RequestPayload)?.message) {
    await create(tenantId, requestId, EntryTypes.eventReceived, {
      body: {
        message: (request as RequestPayload)?.message,
      },
    });

    return;
  }

  await create(tenantId, requestId, EntryTypes.eventReceived, {
    body: request,
  });
};

export const createClickedEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  channel: ChannelDetails,
  data: any
) =>
  create(tenantId, messageId, EntryTypes.eventClick, {
    ...data,
    channel,
    provider,
  });

export const createArchivedEvent = async (
  tenantId: string,
  messageId: string,
  data: any
) => create(tenantId, messageId, EntryTypes.eventArchived, data);

export const createReadEvent = async (
  tenantId: string,
  messageId: string,
  data: IClickDataPush
) => create(tenantId, messageId, EntryTypes.eventRead, data);

export const createUnreadEvent = async (
  tenantId: string,
  messageId: string,
  data: IClickDataPush
) => create(tenantId, messageId, EntryTypes.eventUnread, data);

export type OpenedEventData = Partial<ITrackingRecord> & {
  headers?: {
    [key: string]: string;
  };
  ip?: string;
  channels?: string[];
  userAgent?: string;
};

export const createOpenedEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  channel: ChannelDetails,
  data: OpenedEventData
) =>
  create(tenantId, messageId, EntryTypes.eventOpened, {
    ...data,
    channel,
    provider,
  });

export const createPreparedEvent = async (
  tenantId: string,
  messageId: string,
  data: any
) => create(tenantId, messageId, EntryTypes.eventPrepared, data);

export const createDeliveredEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string,
  providerResponse: object | undefined,
  channel: ChannelDetails,
  timestamp?: number
): Promise<ISafeEventLogEntry> =>
  create(
    tenantId,
    messageId,
    EntryTypes.providerDelivered,
    {
      channel,
      configuration,
      provider,
      providerResponse:
        typeof providerResponse !== "string"
          ? JSON.stringify(providerResponse)
          : providerResponse,
    },
    timestamp
  );

export const createDeliveringEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string,
  channel: ChannelDetails
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerDelivering, {
    channel,
    configuration,
    provider,
  });

export const createErrorEvent = async (
  tenantId: string,
  messageId: string,
  errorMessage: string,
  data?: {
    channel?: ChannelDetails;
    configuration?: string;
    provider?: string;
    providerRequest?: object;
    providerResponse?: object;
    willRetry?: boolean;
  }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerError, {
    ...data,
    errorMessage,
  });

export const createFilteredEvent = async (
  tenantId: string,
  messageId: string,
  details: { [key: string]: any }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.eventFiltered, { details });

export const createMappedEvent = async (
  tenantId: string,
  messageId: string,
  payload: { eventId: string; fromMap: boolean; notificationId: string }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.eventNotificationId, payload);

export const createPollingAttemptEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  retryCount: number,
  previousTtl: number | undefined,
  ttl?: number,
  reason?: string,
  data?: { [key: string]: any }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.pollingAttempt, {
    data,
    previousTtl,
    provider,
    reason,
    retryCount,
    ttl,
  });

export const createPollingErrorEvent = async (
  tenantId: string,
  messageId: string,
  errorMessage: string,
  provider: string,
  retryCount: number,
  data?: object
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.pollingError, {
    ...data,
    errorMessage,
    provider,
    retryCount,
  });

export const createProfileLoadedEvent = async (
  tenantId: string,
  messageId: string,
  payload: {
    mergedProfile: any;
    savedProfile: any;
    sentProfile: any;
  }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.profileLoaded, payload);

export const createRenderedEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string,
  channel: ChannelDetails,
  renderedTemplate: { [key: string]: string | object | any[] },
  trackingIds?: {
    clickTrackingId: string;
    deliverTrackingId: string;
    openTrackingId: string;
    unsubscribeTrackingId: string;
  },
  brand?: {
    id: string;
    version: string;
  },
  renderedFilePath?: string
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerRendered, {
    channel,
    configuration,
    provider,
    renderedTemplate,
    trackingIds,
    brand,
    renderedFilePath,
  });

export const createRetryingEvent = async (
  tenantId: string,
  messageId: string,
  details: { [key: string]: any }
): Promise<ISafeEventLogEntry> => {
  return create(tenantId, messageId, EntryTypes.retrying, details);
};

export const createTimedoutEvent = async (
  tenantId: string,
  messageId: string,
  details: { provider?: string; channel?: string; [key: string]: any }
): Promise<ISafeEventLogEntry> => {
  return create(tenantId, messageId, EntryTypes.timedout, details);
};

export const createRoutedEvent = async (
  tenantId: string,
  messageId: string,
  details: { [key: string]: any }
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.eventRouted, {
    details,
  });

export const createProviderAttemptEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  providerConfigurationId: string,
  channel: ChannelDetails
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerAttempt, {
    channel,
    providerConfigurationId,
    provider,
  });

export const createSentEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string,
  providerResponse: object | undefined,
  channel: ChannelDetails
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerSent, {
    channel,
    configuration,
    provider,
    providerResponse: JSON.stringify(providerResponse),
  });

export const createSimulatedEvent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string,
  providerResponse: object | undefined,
  channel: ChannelDetails
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.providerSimulated, {
    channel,
    configuration,
    provider,
    providerResponse: JSON.stringify(providerResponse),
  });

export const createUnmappedEvent = async (
  tenantId: string,
  messageId: string,
  payload: IEventLogEntryJson
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.eventUnmapped, payload);

export const createUnroutableEvent = async (
  tenantId: string,
  messageId: string,
  type: MessageStatusReason | string,
  reason: string,
  data?: object
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.unroutable, {
    ...data,
    reason,
    type,
  });

export const createUndeliverableEvent = async (
  tenantId: string,
  messageId: string,
  type: MessageStatusReason | string,
  reason: string,
  data?: object
): Promise<ISafeEventLogEntry> =>
  create(tenantId, messageId, EntryTypes.undeliverable, {
    ...data,
    reason,
    type,
  });

export const createWebhookResponseEvent = async (
  tenantId: string,
  messageId: string,
  data: IWebhookResponseData
) => create(tenantId, messageId, EntryTypes.webhookResponse, data);

export const getByType = async (
  tenantId: string,
  messageId: string,
  type: EventLogEntryType
): Promise<IEventLogEntry[]> => {
  const { Items } = await queryItem({
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":messageId": messageId,
      ":tenantId": tenantId,
      ":type": type,
    },
    FilterExpression: "tenantId = :tenantId AND #type = :type",
    IndexName: "ByMessageId",
    KeyConditionExpression: "messageId = :messageId",
    TableName,
  });

  return (Items as IEventLogEntry[]).map((item) => {
    return {
      ...item,
      json: migrateLegacyEventLogJson(item.json),
    };
  });
};

function assertIsSafeEventLogEntry(
  item: DocumentClient.AttributeMap
): asserts item is ISafeEventLogEntry {
  if (!item.json) {
    throw new Error("Item in Event Logs table is not a Safe Event Log.");
  }
}

export const getLogItem = async (tenantId: string, id: string) => {
  const { Item: item } = await getItem({
    Key: { id, tenantId },
    TableName,
  });

  const json = await getJsonValue(migrateLegacyEventLogJson(item.json));
  return { ...item, json };
};

export const getLogs = async (tenantId: string, messageId: string) => {
  if (!tenantId || !messageId) {
    throw new Error("tenantId and messageId required");
  }

  const { Items } = await queryItem({
    ExpressionAttributeValues: {
      ":messageId": messageId,
      ":tenantId": tenantId,
    },
    FilterExpression: "tenantId = :tenantId",
    IndexName: "ByMessageId",
    KeyConditionExpression: "messageId = :messageId",
    TableName,
  });

  const isLogEntryWrongFormat = (
    type: EventLogEntryType,
    json: IEventLogEntryJson
  ) => type === "event:received" && json?.request;

  const formatLogEntry = (json: IEventLogEntryJson) => {
    const { request, ...rest } = json;
    return {
      ...rest,
      body: request,
    };
  };
  const hiddenEvents: Set<EventLogEntryType> = new Set(["provider:attempt"]);

  const results = await Promise.all(
    Items.filter(({ type }) => !hiddenEvents.has(type)).map(async (item) => {
      assertIsSafeEventLogEntry(item);
      let json = await getJsonValue(migrateLegacyEventLogJson(item.json));

      if (isLogEntryWrongFormat(item.type, json)) {
        json = formatLogEntry(json);
      }

      if (item.type === "provider:rendered" && json.renderedTemplate?.subject) {
        json.renderedTemplate.subject = decodeEmailSubject(
          json.renderedTemplate.subject
        );
      }

      if (["provider:error", "provider:sent"].includes(item.type)) {
        if (json?.providerResponse) {
          try {
            const parsed =
              typeof json.providerResponse === "string"
                ? JSON.parse(json.providerResponse)
                : json.providerResponse;
            const truncated = truncateLargeStrings(parsed);
            json.providerResponse = JSON.stringify(truncated);
          } catch (ex) {
            console.error(ex);
            console.error(
              "Error handling providerResponse",
              json.providerResponse
            );
            throw ex;
          }
        }
      }

      return { ...item, json };
    })
  );

  return results;
};

const getMostRecentEventLog = (
  eventLogs: IEventLogEntry[]
): IEventLogEntry | undefined => {
  if (!eventLogs || eventLogs.length === 0) {
    return undefined;
  }

  return eventLogs.reduce((last, current) => {
    return last.timestamp > current.timestamp ? last : current;
  });
};

export const getReceived = async (tenantId: string, messageId: string) => {
  const receivedRecords = await getByType(
    tenantId,
    messageId,
    EntryTypes.eventReceived
  );
  const mostRecent = getMostRecentEventLog(receivedRecords);

  if (!mostRecent || !mostRecent.json || typeof mostRecent.json !== "object") {
    return undefined;
  }

  const received = migrateLegacyReceivedValue(
    await getJsonValue(mostRecent.json)
  );

  return handleJsonObjectsInReceived(received);
};

export const getProfileData = async (tenantId: string, messageId: string) => {
  const profiles = await getByType(
    tenantId,
    messageId,
    EntryTypes.profileLoaded
  );
  const mostRecent = getMostRecentEventLog(profiles);
  const profile =
    mostRecent && mostRecent.json && mostRecent.json.json
      ? (mostRecent.json.json as JSONObject)
      : undefined;

  const sent = await getReceived(tenantId, messageId);
  const sentProfile =
    sent && sent.body && sent.body.profile ? sent.body.profile : undefined;

  if (!profile && !sentProfile) {
    return undefined;
  }

  return {
    ...profile,
    ...sentProfile,
  };
};
