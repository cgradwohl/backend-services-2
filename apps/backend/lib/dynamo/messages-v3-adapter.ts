import messageService from "~/lib/message-service";
import messagesServiceApiV1 from "~/messages/service/api-v1";
import { Message } from "~/messages/types/api-v1/message";
import providers from "~/providers";
import { FullMessage } from "~/types.api";

import { MessageHistoryType } from "../message-service/types";
import { shouldMarkUndeliverable } from "./should-mark-undeliverable";
import { shouldMarkUnroutable } from "./should-mark-unroutable";

export const get = async (
  tenantId: string,
  messageId: string
): Promise<FullMessage | null> => {
  const messages = messagesServiceApiV1(tenantId);
  const message = await messages.get(messageId);

  if (message) {
    const { automationRunId, jobId, messageStatus, ...rest } = message.toItem(
      message.getShard()
    );
    return {
      ...rest,
      jobId,
      runId: automationRunId,
      status: messageStatus,
    } as FullMessage;
  }

  return null;
};

export const create = async (
  tenantId: string,
  eventId: string,
  recipientId: string,
  messageId: string,
  pattern?: string,
  listId?: string,
  listMessageId?: string,
  props?: { [key: string]: any }
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);

  const baseItem = {
    enqueued: Date.now(),
    eventId,
    id: messageId,
    messageStatus: "ENQUEUED",
    recipientId,
    tenantId,
    ...(props || {}),
  };

  const item =
    listId && listMessageId
      ? pattern
        ? { ...baseItem, listId, listMessageId, pattern }
        : { ...baseItem, listId, listMessageId }
      : baseItem;

  // note: messages.create throws AlreadyExistsSendError
  // note: messages.create throws InternalSendError
  await messages.create(new Message({ ...item, messageId }));
};

export const incrementErrorCount = async (
  tenantId: string,
  messageId: string,
  increment: number = 1
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeNames: {
      "#errorCount": "errorCount",
    },
    ExpressionAttributeValues: {
      ":increment": increment,
    },
    UpdateExpression: "ADD #errorCount :increment",
  });
};

export const markClicked = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":messageStatus": "CLICKED",
      ":timestamp": timestamp,
    },
    UpdateExpression:
      "SET messageStatus = :messageStatus, clicked = :timestamp",
  });
};

export const markOpened = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);

  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":clickedMessageStatus": "CLICKED",
      ":messageStatus": "OPENED",
      ":timestamp": timestamp,
    },
    UpdateExpression: "SET messageStatus = :messageStatus, opened = :timestamp",
    ConditionExpression:
      "attribute_exists(pk) AND messageStatus <> :clickedMessageStatus",
  });
};

export const markDelivered = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  const clickedStatus = "CLICKED";
  const openedStatus = "OPENED";
  const p = providers[provider];
  const deliverImmediately =
    p?.deliveryStatusStrategy === "DELIVER_IMMEDIATELY";

  // If strategy is deliverImmediately and sent is present, use sent timestamp, otherwise use current time
  const updateExpression = `set messageStatus = :messageStatus, delivered = ${
    deliverImmediately ? "if_not_exists(sent, :now)" : ":now"
  }, provider = :provider, configuration = :configuration`;

  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":clickedMessageStatus": clickedStatus,
      ":configuration": configuration || null,
      ":messageStatus": "DELIVERED",
      ":now": Date.now(),
      ":openedMessageStatus": openedStatus,
      ":provider": provider,
    },
    UpdateExpression: updateExpression,
    ConditionExpression:
      "attribute_exists(pk) AND messageStatus <> :clickedMessageStatus AND messageStatus <> :openedMessageStatus",
  });
};

export const markUnread = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    UpdateExpression: "REMOVE readTimestamp",
  });
};

export const markRead = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":now": Date.now(),
    },
    UpdateExpression: "SET readTimestamp = :now",
  });
};

export const markArchived = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":now": Date.now(),
    },
    UpdateExpression: "SET archivedTimestamp = :now",
  });
};

export const updateSentStatus = async (tenantId: string, messageId: string) => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":deliveredMessageStatus": "DELIVERED",
      ":messageStatus": "SENT",
    },
    UpdateExpression: "SET messageStatus = :messageStatus",
    ConditionExpression:
      "attribute_exists(pk) AND messageStatus <> :deliveredMessageStatus",
  });
};

export const updateSentExtraData = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
) => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":configuration": configuration || null,
      ":now": Date.now(),
      ":provider": provider,
    },
    UpdateExpression:
      "SET sent = :now, provider = :provider, configuration = :configuration",
  });
};

export const markSimulated = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":configuration": configuration || null,
      ":messageStatus": "SIMULATED",
      ":now": Date.now(),
      ":provider": provider,
    },
    UpdateExpression:
      "SET messageStatus = :messageStatus, sent = :now, provider = :provider, configuration = :configuration",
  });
};

export const markEmail = async (
  tenantId: string,
  messageId: string,
  email: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":email": email,
    },
    UpdateExpression: "SET recipientEmail = :email",
  });
};

export const markUndeliverableCore = async (
  tenantId: string,
  messageId: string,
  payload: {
    configuration?: string;
    errorMessage?: string;
    provider?: string;
  } = {},
  acceptedStatuses: MessageHistoryType[]
): Promise<void> => {
  const messageHistory = await messageService.getHistoryById(
    tenantId,
    messageId,
    undefined
  );

  if (!shouldMarkUndeliverable(messageHistory, acceptedStatuses)) {
    return;
  }

  const now = Date.now();
  const expressionAttributeValues = {
    ":messageStatus": "UNDELIVERABLE",
    ":now": now,
  };
  let updateExpression = "SET messageStatus = :messageStatus, sent = :now";

  if (payload.configuration) {
    expressionAttributeValues[":configuration"] = payload.configuration;
    updateExpression += ", configuration = :configuration";
  }

  if (payload.provider) {
    expressionAttributeValues[":provider"] = payload.provider;
    updateExpression += ", provider = :provider";
  }

  if (payload.errorMessage === "Internal Courier Error") {
    const type = "INTERNAL_COURIER_ERROR";
    expressionAttributeValues[":errorType"] = type;
    updateExpression += ", errorType = :errorType";
  }

  const updateItemQuery = {
    ExpressionAttributeValues: expressionAttributeValues,
    UpdateExpression: updateExpression,
  };

  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, updateItemQuery);
};

export const markUnmapped = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":messageStatus": "UNMAPPED",
    },
    UpdateExpression: "SET messageStatus = :messageStatus",
  });
};

export const markUnroutable = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const messageHistory = await messageService.getHistoryById(
    tenantId,
    messageId,
    undefined
  );

  if (
    !shouldMarkUnroutable(messageHistory, [
      "SENT",
      "DELIVERED",
      "OPENED",
      "CLICKED",
      "UNDELIVERABLE",
    ])
  ) {
    return;
  }

  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":messageStatus": "UNROUTABLE",
    },
    UpdateExpression: "SET messageStatus = :messageStatus",
  });
};

export const setBilledUnits = async (
  tenantId: string,
  messageId: string,
  billedUnits: number
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.setBilledUnits(messageId, billedUnits);
};

export const setNotificationId = async (
  tenantId: string,
  messageId: string,
  notificationId: string
): Promise<void> => {
  const messages = messagesServiceApiV1(tenantId);
  await messages.update(messageId, {
    ExpressionAttributeValues: {
      ":notificationId": notificationId,
    },
    UpdateExpression: "SET notificationId = :notificationId",
  });
};
