import { Lambda } from "aws-sdk";
import * as dynamodb from "~/lib/dynamo";
import { Handler, IDataFixEvent } from "./types";
import s3 from "~/lib/s3";
import {
  getJsonValue,
  create as createLogEntry,
  EntryTypes,
} from "~/lib/dynamo/event-logs";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { putV1 } from "~/api/send";
import { ApiSendRequest } from "~/types.public";
import getBrand from "~/api/send/lib/get-brand";
import parseJsonObject from "~/lib/parse-json-object";
import { TenantScope } from "~/types.internal";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  messageIds: string[];
  scope?: TenantScope;
}

const handler: Handler<IEvent> = async (event) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment variable");
    return;
  }

  try {
    await processMessages(event);
  } catch (error) {
    console.log("Message processing failed");
    console.log(error);
  }
};

async function processMessages(event: IEvent) {
  for (const oldMessageId of event.messageIds) {
    const [{ Items }, { Item: oldMessage }] = await Promise.all([
      dynamodb.query({
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":messageId": oldMessageId,
          ":tenantId": event.tenantId,
          ":type": "event:received",
        },
        FilterExpression: "tenantId = :tenantId AND #type = :type",
        IndexName: "ByMessageId",
        KeyConditionExpression: "messageId = :messageId",
        TableName: process.env.EVENT_LOGS_TABLE_NAME,
      }),
      dynamodb.getItem({
        Key: {
          pk: `${event.tenantId}/${oldMessageId}`,
        },
        TableName: process.env.MESSAGES_V3_TABLE,
      }),
    ]);

    const request: ApiSendRequest = (await getJsonValue(Items[0].json)).body;
    const newMessageId = createTraceId();
    console.log("request", request);
    console.log("oldMessage", oldMessage);

    const brand = request.brand
      ? await getBrand(event.tenantId, request.brand, true)
      : undefined;

    await putV1({
      messageId: newMessageId,
      idempotencyKey: oldMessage.idempotencyKey ?? null,
      messageObject: {
        brand,
        eventId: request.event,
        eventData: parseJsonObject(request.data),
        eventPreferences: parseJsonObject(request.preferences),
        eventProfile: parseJsonObject(request.profile),
        recipientId: request.recipient,
        override: parseJsonObject(request.override),
        scope: event.scope ?? "published/production",
      },
      request,
      tenantId: event.tenantId,
    });
  }
}

export default handler;
