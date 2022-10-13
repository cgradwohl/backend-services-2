import { match } from "typescript-pattern-matching";

import { toApiKey } from "~/lib/api-key-uuid";
import { getLogs } from "~/lib/dynamo/event-logs";
import { get as getMessage } from "~/lib/dynamo/messages";
import { filters, sorts } from "~/lib/event-log-entry";
import parseTaxonomy from "~/lib/parse-taxonomy";
import truncateLongStrings from "~/lib/truncate-long-strings";
import providerRegistry from "~/providers";
import { NotFoundSendError } from "~/send/errors";

import { EventLogEntryType, IChannel, IEventLogEntry } from "~/types.api";
import {
  getChannelKey,
  getEvent,
  getGroupKey,
  getProviders,
  getProviderStatus,
  getSentTimestamp,
} from "./pattern-matching";
import { IMessageLog, MessageStatus } from "./types";

type ProviderDetails = IMessageLog["providers"];
type Reason = IMessageLog["reason"];
interface IMessageArg {
  archivedTimestamp?: number;
  enqueued: number;
  idempotencyKey?: string;
  jobId?: string;
  listId?: string;
  listMessageId?: string;
  messageId: string;
  recipientEmail?: string;
  recipientId: string;
  runId?: string;
  status: string;
  tags?: string[];
  traceId?: string;
}
type CreateMessagesArg = string | IMessageArg[];

const UNDELIVERABLE_EVENTS: readonly EventLogEntryType[] = [
  "provider:error",
  "undeliverable",
];

const ERROR_EVENTS: readonly EventLogEntryType[] = [
  "polling:error",
  ...UNDELIVERABLE_EVENTS,
  "unroutable",
];
const STATUSES_WITH_NO_PROVIDERS: readonly MessageStatus[] = [
  "ENQUEUED",
  "UNMAPPED",
  "UNROUTABLE",
];
const EVENT_TYPE_TO_STATUS: ReadonlyMap<EventLogEntryType, MessageStatus> =
  new Map([
    ["event:opened", "OPENED"],
    ["event:click", "CLICKED"],
    ["provider:delivered", "DELIVERED"],
    ["provider:error", "UNDELIVERABLE"],
    ["provider:sent", "SENT"],
    ["provider:simulated", "SIMULATED"],
    ["undeliverable", "UNDELIVERABLE"],
  ]);

const { byEvent } = filters;
const { byTimetampAsc, byTimetampDesc } = sorts;

const createMessages = async (
  tenantId: string,
  arg: CreateMessagesArg,
  includeProviders: boolean
): Promise<IMessageLog[]> => {
  const mapMessages = async (messages: IMessageArg[]) =>
    Promise.all(
      messages.map(async (message) =>
        createMessage(tenantId, message, includeProviders)
      )
    );

  return (
    match(arg)
      .with(String, async (messageId) =>
        createMessages(
          tenantId,
          [await get(tenantId, messageId)],
          includeProviders
        )
      )
      .with(
        [
          {
            enqueued: Number,
            messageId: String,
            // NOTE: commenting recipientId type matching due to an error coming from
            // Automation steps that do not have a recipientId defined.
            // Put this back after the fix C-3193: https://linear.app/trycourier/issue/C-3193/error-unknown-arg-pattern-found-%5Benqueued1622553658060eventidinsights
            // recipientId: String,
            status: String,
          },
        ],
        async (messages) => mapMessages(messages)
      )
      // Should not hit here since the Array pattern is against required properties.
      .otherwise(() => {
        throw new Error(`Unknown arg pattern found: ${JSON.stringify(arg)}`);
      })
      .run()
  );
};

const createMessage = async (
  tenantId: string,
  message: IMessageArg,
  includeProviders: boolean
): Promise<IMessageLog> => {
  const {
    archivedTimestamp,
    enqueued,
    idempotencyKey,
    jobId,
    listId,
    listMessageId,
    messageId: id,
    recipientEmail,
    recipientId,
    runId,
    tags,
    traceId,
  } = message;
  const status = message.status as MessageStatus;
  const logs = await getLogs(tenantId, id);
  const recipient = recipientEmail || recipientId;

  const {
    clicked,
    delivered,
    error,
    event,
    notification,
    opened,
    providers,
    reason,
    sent,
    willRetry,
  } = getLogDetails(logs, status, includeProviders);

  return {
    archived: archivedTimestamp,
    clicked,
    delivered,
    enqueued,
    error,
    event,
    id,
    idempotencyKey,
    jobId,
    listId,
    listMessageId,
    notification,
    opened,
    providers,
    reason,
    recipient,
    recipientId,
    runId,
    sent,
    status,
    tags,
    traceId,
    willRetry,
  };
};

const get = async (tenantId: string, id: string): Promise<IMessageArg> => {
  const message: IMessageArg = await getMessage(tenantId, id);
  if (!message) {
    throw new NotFoundSendError(`Message ${id} not found`);
  }

  // TODO: https://linear.app/trycourier/issue/C-5186/update-documentation-for-messagetimeoutsmessage

  return message;
};

const getLogDetails = (
  logs: IEventLogEntry[],
  status: MessageStatus,
  includeProviders: boolean
) => {
  const sortedLogs = logs.sort(byTimetampAsc);

  const lastErrorMessage = findLastErrorMessage(sortedLogs);
  const eventOpened = sortedLogs.find(byEvent("event:opened"));
  const eventClicked = sortedLogs.find(byEvent("event:click"));
  const eventNotification = sortedLogs.find(byEvent("event:notificationId"));
  const eventReceived = sortedLogs.find(byEvent("event:received"));
  // Remove items such as attachments as Base64 strings
  const truncatedEventReceived = eventReceived
    ? {
        ...eventReceived,
        json: truncateLongStrings(eventReceived.json),
      }
    : undefined;

  const eventUnmapped = sortedLogs.find(byEvent("event:unmapped"));
  const delivered = getProviderDeliveredTimestamp(
    sortedLogs.find(byEvent("provider:delivered"))
  );
  const providerSent = sortedLogs.find(byEvent("provider:sent"));
  const sent = getSentTimestamp({ providerSent, delivered });

  const event = getEvent({
    eventNotification,
    eventReceived: truncatedEventReceived,
    eventUnmapped,
  });

  const reason = ["UNDELIVERABLE", "UNROUTABLE"].includes(status)
    ? getReason(
        sortedLogs.find(
          byEvent("provider:error", "undeliverable", "unroutable")
        ),
        sortedLogs.find(byEvent("event:filtered"))
      )
    : undefined;

  const providers = getProviders(
    {
      includeProviders,
      statusWithProviders: !STATUSES_WITH_NO_PROVIDERS.includes(status),
    },
    () => getProviderLogDetails(logs)
  );

  return {
    clicked: eventClicked ? eventClicked.timestamp : undefined,
    delivered,
    error:
      lastErrorMessage && ["UNDELIVERABLE", "UNROUTABLE"].includes(status)
        ? lastErrorMessage
        : undefined,
    event,
    notification: eventNotification?.json?.notificationId
      ? toApiKey(eventNotification.json.notificationId)
      : undefined,
    opened: eventOpened ? eventOpened.timestamp : undefined,
    providers,
    reason,
    sent,
    willRetry: status === "UNDELIVERABLE" ? willRetry(logs) : undefined,
  };
};

const getProviderLogDetails = (logs: IEventLogEntry[]): ProviderDetails => {
  const groupedLogs: ReadonlyMap<string, IEventLogEntry[]> = logs
    .filter(({ type }) => EVENT_TYPE_TO_STATUS.has(type))
    .reduce((acc, log) => {
      // Attempts to group provider logs by channel ID.
      // If it's not available for legacy data, group by provider
      const { channel, channelId, provider } = log.json as {
        channel?: { id: string };
        channelId?: string;
        provider: string;
      };
      const groupKey = getGroupKey(provider, channel, channelId);
      const group = acc.get(groupKey) || [];
      group.push(log);

      acc.set(groupKey, group);

      return acc;
    }, new Map<string, IEventLogEntry[]>());

  return [...groupedLogs.entries()].reduce((acc, [, logGroup]) => {
    const sortedLogs = logGroup.sort(byTimetampAsc);
    const lastErrorMessage = findLastErrorMessage(sortedLogs);
    const eventClicked = sortedLogs.find(byEvent("event:click"));
    const eventOpened = sortedLogs.find(byEvent("event:opened"));
    const providerDelivered = sortedLogs.find(byEvent("provider:delivered"));
    const delivered = getProviderDeliveredTimestamp(providerDelivered);

    const providerSent = sortedLogs.find(byEvent("provider:sent"));
    const sent = getSentTimestamp({ providerSent, delivered });

    const reference = getProviderReference(providerSent, providerDelivered);
    const status = findProviderStatus(logGroup);

    const reversedSortedLogs = logGroup.sort(byTimetampDesc);
    const providerError = reversedSortedLogs.find(byEvent("provider:error"));
    const undeliverable = reversedSortedLogs.find(byEvent("undeliverable"));

    const channel = getChannel(
      providerSent,
      providerDelivered,
      undeliverable,
      providerError
    );
    const logWithProvider = sortedLogs.find(
      byEvent(
        "provider:error",
        "provider:sent",
        "provider:simulated",
        "undeliverable",
        "provider:delivered"
      )
    );

    const providerResponse = getProviderResponse(
      status,
      providerSent,
      providerDelivered,
      providerError
    );

    const providerEntry = {
      channel,
      clicked: eventClicked ? eventClicked.timestamp : undefined,
      delivered,
      error: lastErrorMessage,
      opened: eventOpened ? eventOpened.timestamp : undefined,
      provider: logWithProvider ? logWithProvider.json.provider : undefined,
      providerResponse,
      reference,
      sent,
      status,
    };

    acc.push(providerEntry);

    return acc;
  }, []);
};

const getProviderDeliveredTimestamp = (event: IEventLogEntry) => {
  if (!event) {
    return undefined;
  }

  const {
    json: { provider: providerKey, providerResponse },
  } = event;
  if (!providerResponse) {
    return event.timestamp;
  }

  const provider = providerRegistry[providerKey];

  return (
    (provider.getDeliveredTimestamp &&
      provider.getDeliveredTimestamp(providerResponse)) ||
    event.timestamp
  );
};

const getProviderReference = (
  providerSent: IEventLogEntry,
  providerDelivered: IEventLogEntry
) => {
  if (!providerSent && !providerDelivered) {
    return undefined;
  }

  const DEFAULT_JSON = Object.freeze({
    json: { provider: undefined, providerResponse: undefined },
  });
  const {
    json: { provider: providerSentKey, providerResponse: providerResponseSent },
  } = providerSent || DEFAULT_JSON;
  const {
    json: {
      provider: providerDeliveredKey,
      providerResponse: providerResponseDelivered,
    },
  } = providerDelivered || DEFAULT_JSON;

  const provider = providerRegistry[providerDeliveredKey || providerSentKey];

  return provider.getReference
    ? provider.getReference(providerResponseSent, providerResponseDelivered)
    : undefined;
};

const findLastErrorMessage = (logs: IEventLogEntry[]) => {
  const errorEvent = logs.sort(byTimetampDesc).find(byEvent(...ERROR_EVENTS));
  if (!errorEvent) {
    return undefined;
  }

  const { type, json } = errorEvent;
  switch (type) {
    case "polling:error":
    case "provider:error":
      return json.errorMessage;
    case "undeliverable":
    case "unroutable":
      return json.reasonDetails ?? json.reason;
  }
};

const getReason = (
  event: IEventLogEntry, // can be unroutable, undeliverable or provider error
  eventFiltered: IEventLogEntry
): Reason => {
  if (eventFiltered) {
    return "FILTERED";
  }

  const eventJson = event?.json;

  if (eventJson?.type) {
    return eventJson.type;
  }

  // Legacy check against messages
  switch (eventJson?.reason) {
    case "Notification Disabled":
    case "Notification Disabled by Category":
      return "UNSUBSCRIBED";
    case "No providers added":
      return "NO_PROVIDERS";
    case "No Valid Delivery Channel":
      return "NO_CHANNELS";
    default:
      return "PROVIDER_ERROR";
  }
};

const findProviderStatus = (logs: IEventLogEntry[]): MessageStatus => {
  const sortedLogs = logs.sort(byTimetampDesc);
  const foundEvents = {
    clicked: Boolean(sortedLogs.find(byEvent("event:click"))),
    delivered: Boolean(sortedLogs.find(byEvent("provider:delivered"))),
    opened: Boolean(sortedLogs.find(byEvent("event:opened"))),
    sent: Boolean(sortedLogs.find(byEvent("provider:sent"))),
    undeliverable: Boolean(sortedLogs.find(byEvent(...UNDELIVERABLE_EVENTS))),
  };

  return getProviderStatus(foundEvents);
};

const getChannel = (
  providerSent: IEventLogEntry,
  providerDelivered: IEventLogEntry,
  undeliverable: IEventLogEntry,
  providerError: IEventLogEntry
) =>
  tryGetChannel(providerSent) ||
  tryGetChannel(providerDelivered) ||
  tryGetChannel(undeliverable) ||
  tryGetChannel(providerError);

const tryGetChannel = (log: IEventLogEntry) => {
  if (!log || !log.json.channel) {
    return undefined;
  }

  const channel: IChannel = log.json.channel;

  let key: string;
  if (!channel.taxonomy) {
    key = undefined;
  } else {
    const parsedTaxonomy = parseTaxonomy(channel.taxonomy);
    key = getChannelKey(
      {
        hasClass: ["*", undefined].includes(parsedTaxonomy.class),
        hasStar: channel.taxonomy.includes("*"),
      },
      parsedTaxonomy
    );
  }

  return {
    key,
    name: channel.label,
    template: channel.id,
  };
};

const getProviderResponse = (
  status: MessageStatus,
  providerSent: IEventLogEntry,
  providerDelivered: IEventLogEntry,
  providerError: IEventLogEntry
) => {
  let response;
  switch (status) {
    case "SENT": {
      response = providerSent?.json?.providerResponse;
      break;
    }
    case "DELIVERED": {
      response = providerDelivered?.json?.providerResponse;
      break;
    }
    case "UNDELIVERABLE": {
      response = providerError?.json?.providerResponse;
      break;
    }
    default: {
      return undefined;
    }
  }
  return typeof response === "string" ? JSON.parse(response) : response;
};

const willRetry = (logs: IEventLogEntry[]) => {
  return logs.sort(byTimetampDesc).find(byEvent("provider:error"))?.json
    ?.willRetry;
};

export default createMessages;
