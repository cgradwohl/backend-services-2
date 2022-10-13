import * as dynamodb from "~/lib/dynamo";
import * as Types from "~/types.api";
import getTableName, { TABLE_NAMES } from "./dynamo/tablenames";

const TableName = getTableName(TABLE_NAMES.EVENT_MAPS_TABLE);

export const create = async ({
  eventId,
  notifications,
  tenantId,
  userId,
}: {
  eventId: string;
  notifications?: Array<{ notificationId: string }>;
  tenantId: string;
  userId?: string;
}) => {
  const creator = userId || `tenant/${tenantId}`;
  const now = Date.now();

  const item: Types.IEventMap = {
    created: now,
    creator,
    eventId,
    notifications: notifications || [],
    tenantId,
    updated: now,
    updator: creator,
  };

  await dynamodb.put({
    Item: item,
    TableName,
  });

  return item;
};

export const remove = async ({
  eventId,
  tenantId,
}: {
  eventId: string;
  tenantId: string;
}): Promise<void> => {
  await dynamodb.deleteItem({
    Key: {
      eventId,
      tenantId,
    },
    TableName,
  });
};

export const get = async ({
  eventId,
  tenantId,
}: {
  eventId: string;
  tenantId: string;
}): Promise<Types.IEventMap> => {
  const { Item: item } = await dynamodb.getItem({
    Key: {
      eventId,
      tenantId,
    },
    TableName,
  });

  return item as Types.IEventMap;
};

export const list = async ({
  tenantId,
}: {
  tenantId: string;
}): Promise<Types.IEventMap[]> => {
  const { Items: items } = await dynamodb.query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    KeyConditionExpression: "tenantId = :tenantId",
    TableName,
  });

  return items as Types.IEventMap[];
};

export const getByTemplateId = async ({
  templateId,
  tenantId,
}: {
  templateId: string;
  tenantId: string;
}): Promise<Types.IEventMap[]> => {
  const { Items: items } = await dynamodb.query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    KeyConditionExpression: "tenantId = :tenantId",
    TableName,
  });

  return items?.filter((map) =>
    map.notifications.some((n) => n.notificationId === templateId)
  ) as Types.IEventMap[];
};

export const replace = async (
  {
    eventId,
    tenantId,
    userId,
  }: { tenantId: string; eventId: string; userId: string },
  {
    eventId: newEventId,
    notifications: newNotifications,
  }: { eventId: string; notifications: Array<{ notificationId: string }> }
) => {
  if (newEventId === eventId) {
    const { Attributes: eventMap } = await dynamodb.update({
      ExpressionAttributeNames: {
        "#notifications": "notifications",
        "#updated": "updated",
        "#updator": "updator",
      },
      ExpressionAttributeValues: {
        ":newNotifications": newNotifications,
        ":updated": Date.now(),
        ":updator": userId,
      },
      Key: {
        eventId,
        tenantId,
      },
      ReturnValues: "ALL_NEW",
      TableName,
      UpdateExpression:
        "SET #notifications = :newNotifications, #updated = :updated, #updator = :updator",
    });

    return eventMap as Types.IEventMap;
  }

  // can't replace a value used for the key so we need to clone and remove the old event
  const { Item: oldEventMap } = await dynamodb.getItem({
    Key: { tenantId, eventId },
    TableName,
  });

  const newEventMap = {
    ...oldEventMap,
    eventId: newEventId,
    notifications: newNotifications,
    updated: Date.now(),
    updator: userId,
  };

  await dynamodb.put({
    Item: newEventMap,
    TableName,
  });

  await dynamodb.deleteItem({
    Key: { tenantId, eventId },
    TableName,
  });

  return newEventMap;
};
