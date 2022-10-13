import logger from "~/lib/logger";
import messageService from "~/lib/message-service";
import providers from "~/providers";
import makeError from "make-error";

import { FullMessage, ListMessagesResponse } from "../../types.api";
import { MessageHistoryType } from "../message-service/types";
import sortBy from "../sort";
import { getItem, put as putItem, query, update as updateItem } from "./index";
import { shouldMarkUndeliverable } from "./should-mark-undeliverable";
import getTableName, { TABLE_NAMES } from "./tablenames";
import { DuplicateMessageIdError } from "~/messages/service/api-v1/errors";

const MAX_LIMIT = 25;
const SCAN_INDEX_FORWARD = {
  ASCENDING: true,
  DESCENDING: false,
};

export const get = async (
  tenantId: string,
  messageId: string
): Promise<FullMessage | null> => {
  const messageRes = await getItem({
    Key: {
      id: messageId,
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
  });

  if (!messageRes || !messageRes.Item) {
    return null;
  }

  const item = messageRes.Item;
  item.messageId = item.id;
  delete item.id;
  item.status = item.messageStatus;
  delete item.messageStatus;
  item.runId = item.automationRunId;
  delete item.automationRunId;

  return item as FullMessage;
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
  const now = Date.now();

  const baseItem = {
    enqueued: now,
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

  try {
    await putItem({
      Item: item,
      ConditionExpression:
        "attribute_not_exists(id) AND attribute_not_exists(tenantId)",
      TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    });
  } catch (err) {
    if (err && err.code === "ConditionalCheckFailedException") {
      console.warn(
        `Duplicate messageId: ${messageId}`,
        JSON.stringify(item, null, 2)
      );
      throw new DuplicateMessageIdError();
    }

    throw err;
  }
};

export const list = async ({
  limit,
  next: start,
  tenantId,
}: {
  limit?: number;
  next?: string | Array<number | string>;
  tenantId: string;
}): Promise<ListMessagesResponse> => {
  limit = !limit || limit > MAX_LIMIT ? MAX_LIMIT : limit;

  // start parameter is string, we need to convert it to Array object to be able to access its elements
  let startArray;
  try {
    if (typeof start === "string") {
      startArray = JSON.parse(start);
    }
  } catch {
    startArray = start;
  }

  const ExclusiveStartKey = startArray
    ? {
        enqueued: startArray[0],
        id: startArray[1],
        tenantId,
      }
    : undefined;

  const requestData = {
    ExclusiveStartKey,
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "ByEnqueuedDateIndex",
    KeyConditionExpression: "tenantId = :tenantId",
    // ask for an additional item in order to check for a next page
    Limit: limit + 1,
    ScanIndexForward: SCAN_INDEX_FORWARD.DESCENDING,
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
  };

  const res = await query(requestData);
  const items = res.Items || [];

  let next;

  // was using res.LastEvaluatedKey but that gave false positives
  // so instead ask for an additional item to determine if there
  // is a next page
  if (items.length === limit + 1) {
    // remove the extra item
    items.pop();

    // make the last evaluated key smaller by using an object
    // and not passing along the tennantId
    const lastItem = items[items.length - 1];
    next = JSON.stringify([lastItem.enqueued, lastItem.id]);
  }

  return {
    messages: items
      .map((item) => ({
        enqueued: item.enqueued,
        errorCount: item.errorCount,
        eventId: item.eventId,
        messageId: item.id,
        notificationId: item.notificationId,
        provider: item.provider,
        recipientEmail: item.recipientEmail,
        recipientId: item.recipientId,
        status: item.messageStatus,
        tenantId: item.tenantId,
      }))
      .sort(sortBy.descending((item) => item.enqueued)),
    next,
  };
};

export const incrementErrorCount = async (
  tenantId: string,
  messageId: string,
  increment: number = 1
): Promise<void> => {
  await updateItem({
    ExpressionAttributeNames: {
      "#errorCount": "errorCount",
    },
    ExpressionAttributeValues: {
      ":increment": increment,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "ADD #errorCount :increment",
  });
};

export const markClicked = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  const updateMarkClickedQuery = {
    ExpressionAttributeValues: {
      ":messageStatus": "CLICKED",
      ":timestamp": timestamp,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression:
      "SET messageStatus = :messageStatus, clicked = :timestamp",
  };
  try {
    await updateItem(updateMarkClickedQuery);
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markedClicked:- ${JSON.stringify(
        updateMarkClickedQuery,
        null,
        2
      )}`
    );
    throw error;
  }
};

export const markOpened = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  const clickedStatus = "CLICKED";
  // The corresponding update method in v3 can fail because of multiple checks
  // in ConditionExpression; so we cannot assume the message exists in v2
  // hence, attribute_exists(tenantId) AND attribute_exists(id) are required
  const conditionExpression =
    "attribute_exists(tenantId) AND attribute_exists(id) AND messageStatus <> :clickedMessageStatus";
  const markOpenedQuery = {
    ConditionExpression: conditionExpression,
    ExpressionAttributeValues: {
      ":clickedMessageStatus": clickedStatus,
      ":messageStatus": "OPENED",
      ":timestamp": timestamp,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "SET messageStatus = :messageStatus, opened = :timestamp",
  };
  try {
    await updateItem(markOpenedQuery);
  } catch (err) {
    if (err && err.code === "ConditionalCheckFailedException") {
      logger.debug(
        `${messageId} cannot be marked as OPENED as it has been marked ${clickedStatus}`
      );
      return;
    }
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markOpened:- ${JSON.stringify(markOpenedQuery, null, 2)}`
    );
    throw err;
  }
};

export const markDelivered = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  const clickedStatus = "CLICKED";
  const openedStatus = "OPENED";
  // The corresponding update method in v3 can fail because of multiple checks
  // in ConditionExpression; so we cannot assume the message exists in v2
  // hence, attribute_exists(tenantId) AND attribute_exists(id) are required
  const conditionExpression =
    "attribute_exists(tenantId) AND attribute_exists(id) AND messageStatus <> :clickedMessageStatus AND messageStatus <> :openedMessageStatus";

  const p = providers[provider];
  const deliverImmediately =
    p?.deliveryStatusStrategy === "DELIVER_IMMEDIATELY";

  // If strategy is deliverImmediately and sent is present, use sent timestamp, otherwise use current time
  const updateExpression = `set messageStatus = :messageStatus, delivered = ${
    deliverImmediately ? "if_not_exists(sent, :now)" : ":now"
  }, provider = :provider, configuration = :configuration`;

  const updateMarkDeliveredQuery = {
    ConditionExpression: conditionExpression,
    ExpressionAttributeValues: {
      ":clickedMessageStatus": clickedStatus,
      ":configuration": configuration || null,
      ":messageStatus": "DELIVERED",
      ":now": Date.now(),
      ":openedMessageStatus": openedStatus,
      ":provider": provider,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: updateExpression,
  };

  try {
    await updateItem(updateMarkDeliveredQuery);
  } catch (err) {
    if (err && err.code === "ConditionalCheckFailedException") {
      logger.debug(
        `${messageId} cannot be marked as DELIVERED as it has been marked ${clickedStatus} or ${openedStatus}`
      );
      return;
    }
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markDelivered:- ${JSON.stringify(
        updateMarkDeliveredQuery,
        null,
        2
      )}`
    );
    throw err;
  }
};

export const markUnread = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const markUnreadQuery = {
    Key: {
      id: messageId,
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "REMOVE readTimestamp",
  };
  try {
    await updateItem(markUnreadQuery);
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markUnread:- ${JSON.stringify(markUnreadQuery, null, 2)}`
    );
    throw error;
  }
};

export const markRead = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  const now = Date.now();
  const updateMarkReadQuery = {
    ExpressionAttributeValues: {
      ":now": now,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "SET readTimestamp = :now",
  };
  try {
    await updateItem(updateMarkReadQuery);
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markRead:- ${JSON.stringify(updateMarkReadQuery, null, 2)}`
    );

    throw error;
  }
};

export const updateSentStatus = async (tenantId: string, messageId: string) => {
  const deliveredStatus = "DELIVERED";
  // The corresponding update method in v3 can fail because of multiple checks
  // in ConditionExpression; so we cannot assume the message exists in v2
  // hence, attribute_exists(tenantId) AND attribute_exists(id) are required
  const conditionExpression = `attribute_exists(tenantId) AND attribute_exists(id) AND messageStatus <> :deliveredMessageStatus`;
  const updateSentStatusQuery = {
    ConditionExpression: conditionExpression,
    ExpressionAttributeValues: {
      ":deliveredMessageStatus": deliveredStatus,
      ":messageStatus": "SENT",
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "SET messageStatus = :messageStatus",
  };

  try {
    await updateItem(updateSentStatusQuery);
  } catch (err) {
    if (err && err.code === "ConditionalCheckFailedException") {
      logger.debug(
        `${messageId} cannot be marked as SENT as it has been marked ${deliveredStatus}`
      );
      return;
    }
    throw err;
  }
};

export const updateSentExtraData = (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
) => {
  const now = Date.now();
  const updateSentExtraDataQuery = {
    ExpressionAttributeValues: {
      ":configuration": configuration || null,
      ":now": now,
      ":provider": provider,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression:
      "SET sent = :now, provider = :provider, configuration = :configuration",
  };

  return updateItem(updateSentExtraDataQuery);
};

export const markSimulated = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  const now = Date.now();

  const updateSimulatedQuery = {
    ExpressionAttributeValues: {
      ":configuration": configuration || null,
      ":messageStatus": "SIMULATED",
      ":now": now,
      ":provider": provider,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression:
      "SET messageStatus = :messageStatus, sent = :now, provider = :provider, configuration = :configuration",
  };
  await updateItem(updateSimulatedQuery);
};

export const markEmail = async (
  tenantId: string,
  messageId: string,
  email: string
): Promise<void> => {
  await updateItem({
    ExpressionAttributeValues: {
      ":email": email,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
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
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: updateExpression,
  };
  try {
    await updateItem(updateItemQuery);
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(
      `Look here markUndeliverableCore ${JSON.stringify(updateItemQuery)}`
    );
    throw error;
  }
};

export const markUnmapped = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  await updateItem({
    ExpressionAttributeValues: {
      ":messageStatus": "UNMAPPED",
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "SET messageStatus = :messageStatus",
  });
};

export const setNotificationId = async (
  tenantId: string,
  messageId: string,
  notificationId: string
): Promise<void> => {
  await updateItem({
    ExpressionAttributeValues: {
      ":notificationId": notificationId,
    },
    Key: {
      id: messageId,
      tenantId,
    },
    ReturnValues: "NONE",
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
    UpdateExpression: "SET notificationId = :notificationId",
  });
};
