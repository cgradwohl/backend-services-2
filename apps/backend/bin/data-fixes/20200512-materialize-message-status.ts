import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { subDays } from "date-fns";
import { scan, update } from "~/lib/dynamo";
import { EntryTypes, getLogs } from "~/lib/dynamo/event-logs";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log, { error } from "~/lib/log";

const lambda = new Lambda({ apiVersion: "2015-03-31" });
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

interface IMessage {
  id: string;
  messageStatus: "SENT" | "UNDELIVERABLE";
  tenantId: string;
}

const materializeMessageStatus = async (message: IMessage) => {
  const { tenantId, id } = message;
  const logs = await getLogs(tenantId, id);

  const sent = logs.find((entry) => entry.type === EntryTypes.providerSent);

  if (!sent) {
    return;
  }

  await update({
    ConditionExpression: "messageStatus = :precondition",
    ExpressionAttributeValues: {
      ":configuration": sent.json.configuration || null,
      ":delivered": sent.timestamp,
      ":messageStatus": "SENT",
      ":precondition": "UNDELIVERABLE",
      ":provider": sent.json.provider,
    },
    Key: {
      id: message.id,
      tenantId: message.tenantId,
    },
    ReturnValues: "NONE",
    TableName,
    UpdateExpression:
      "SET configuration = :configuration, delivered = :delivered, messageStatus = :messageStatus, provider = :provider",
  });

  log(`${message.id} marked SENT`);
};

export const handle = async (
  event: { lastEvaluatedKey?: DocumentClient.Key },
  context: Context
) => {
  const { lastEvaluatedKey } = event;

  const results = await scan({
    ExclusiveStartKey: lastEvaluatedKey,
    ExpressionAttributeValues: {
      ":delivered": subDays(Date.now(), 5).getTime(),
      ":messageStatus": "UNDELIVERABLE",
    },
    FilterExpression:
      "messageStatus = :messageStatus AND delivered >= :delivered",
    Limit: 50,
    TableName,
  });

  const { LastEvaluatedKey } = results;
  const messages = results.Items as IMessage[];

  for (const message of messages) {
    try {
      if (message.messageStatus === "UNDELIVERABLE") {
        await materializeMessageStatus(message);
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
