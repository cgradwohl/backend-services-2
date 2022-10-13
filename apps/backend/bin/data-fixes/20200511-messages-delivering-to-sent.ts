import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { scan, update } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log, { error } from "~/lib/log";

const lambda = new Lambda({ apiVersion: "2015-03-31" });
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

interface IMessage {
  id: string;
  messageStatus:
    | "CLICKED"
    | "ENQUEUED"
    | "DELIVERED"
    | "DELIVERING"
    | "ERROR"
    | "SENT"
    | "UNMAPPED";
  tenantId: string;
}

const updateMessageStatus = async (message: IMessage) => {
  const messageStatus = "SENT";

  await update({
    ConditionExpression: "messageStatus = :precondition",
    ExpressionAttributeValues: {
      ":messageStatus": messageStatus,
      ":precondition": "DELIVERING",
    },
    Key: {
      id: message.id,
      tenantId: message.tenantId,
    },
    ReturnValues: "NONE",
    TableName,
    UpdateExpression: "SET messageStatus = :messageStatus",
  });
  log(`${message.id} marked ${messageStatus}`);
};

export const handle = async (
  event: { lastEvaluatedKey?: DocumentClient.Key },
  context: Context
) => {
  const { lastEvaluatedKey } = event;

  const results = await scan({
    ExclusiveStartKey: lastEvaluatedKey,
    ExpressionAttributeValues: {
      ":messageStatus": "DELIVERING",
    },
    FilterExpression: "messageStatus = :messageStatus",
    Limit: 50,
    TableName,
  });

  const { LastEvaluatedKey } = results;
  const messages = results.Items as IMessage[];

  for (const message of messages) {
    try {
      if (message.messageStatus === "DELIVERING") {
        await updateMessageStatus(message);
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
