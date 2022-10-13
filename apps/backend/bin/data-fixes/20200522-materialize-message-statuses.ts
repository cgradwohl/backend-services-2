import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { scan, update } from "~/lib/dynamo";
import { EntryTypes, getLogs } from "~/lib/dynamo/event-logs";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { filters } from "~/lib/event-log-entry";
import log, { error } from "~/lib/log";
import { IEventLogEntry } from "~/types.api";

const lambda = new Lambda({ apiVersion: "2015-03-31" });
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);
const { byEvent } = filters;

interface IMessage {
  id: string;
  messageStatus: "SENT" | "UNMAPPED";
  tenantId: string;
}

const materializeMessageStatuses = async (message: IMessage) => {
  const { tenantId, id } = message;
  const logs: IEventLogEntry[] = await getLogs(tenantId, id);

  const sent = logs.find(byEvent(EntryTypes.providerSent));
  const undeliverable = logs.find(
    byEvent(EntryTypes.undeliverable, EntryTypes.providerError)
  );

  if (!sent && !undeliverable) {
    return;
  }

  await update({
    ExpressionAttributeValues: {
      ":sent": sent ? sent.timestamp : undeliverable.timestamp,
    },
    Key: {
      id: message.id,
      tenantId: message.tenantId,
    },
    ReturnValues: "NONE",
    TableName,
    UpdateExpression: `SET sent = :sent`,
  });

  log(`${message.id} updated for sent`);

  await update({
    ExpressionAttributeNames: {
      "#delivered": "delivered",
      "#providerResponse": "providerResponse",
    },
    Key: {
      id: message.id,
      tenantId: message.tenantId,
    },
    ReturnValues: "NONE",
    TableName,
    UpdateExpression: "REMOVE #delivered, #providerResponse",
  });

  log(`${message.id} removed delivered and providerResponse`);

  const delivered = logs.find(byEvent(EntryTypes.providerDelivered));
  if (delivered) {
    await update({
      ExpressionAttributeValues: {
        ":delivered": delivered ? delivered.timestamp : undefined,
      },
      Key: {
        id: message.id,
        tenantId: message.tenantId,
      },
      ReturnValues: "NONE",
      TableName,
      UpdateExpression: `SET delivered = :delivered`,
    });

    log(`${message.id} updated for delivered`);
  }
};

export const handle = async (
  event: { lastEvaluatedKey?: DocumentClient.Key },
  context: Context
) => {
  const { lastEvaluatedKey } = event;

  const results = await scan({
    ExclusiveStartKey: lastEvaluatedKey,
    ExpressionAttributeValues: {
      ":messageStatus": "UNMAPPED",
    },
    FilterExpression:
      "messageStatus <> :messageStatus AND attribute_not_exists(sent)",
    Limit: 55,
    TableName,
  });

  const { LastEvaluatedKey } = results;
  const messages = results.Items as IMessage[];

  for (const message of messages) {
    try {
      if (message.messageStatus !== "UNMAPPED") {
        await materializeMessageStatuses(message);
      }
    } catch (err) {
      error(err);
    }
  }

  if (LastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({ lastEvaluatedKey: LastEvaluatedKey }),
      })
      .promise();
  }
};
