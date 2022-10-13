import { scan, update } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";

const test = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

interface IMessage {
  tenantId: string;
  id: string;
  notificationId: string;
  eventId: string;
}

const migrate = async (item: IMessage) => {
  if (item.notificationId) {
    return;
  }

  if (!test.test(item.eventId)) {
    console.log("Invalid event id:", item.eventId);
    return;
  }

  const notificationId = item.eventId;

  console.log("Notification ID:", notificationId);

  update({
    ExpressionAttributeValues: {
      ":notificationId": notificationId,
    },
    Key: {
      id: item.id,
      tenantId: item.tenantId,
    },
    ReturnValues: "ALL_NEW",
    TableName,
    UpdateExpression: "SET notificationId = :notificationId",
  });
};

export const handle = async () => {
  let ExclusiveStartKey;

  while (true) {
    const res = await scan({
      ExclusiveStartKey,
      FilterExpression: "attribute_not_exists(notificationId)",
      TableName,
    });

    console.log(`Processing ${res.Items.length} items.`);

    const results = await Promise.all((res.Items as IMessage[]).map(migrate));

    console.log(JSON.stringify(results, null, 2));

    if (res.LastEvaluatedKey && res.Items.length) {
      ExclusiveStartKey = res.LastEvaluatedKey;
    } else {
      break;
    }
  }

  console.log("message-event-id-to-notification-id complete");
};
