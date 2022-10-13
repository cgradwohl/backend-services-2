import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { query } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import enqueue from "~/lib/enqueue";
import { SqsPrepareMessage } from "~/types.internal";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

interface IMessage {
  id: string;
  tenantId: string;
}

interface IEvent extends IDataFixEvent {
  lastEvaluatedKey?: DocumentClient.Key;
  startTs: number;
  endTs: number;
  tenantId: string;
}

const enqueuePrepare = enqueue<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_NAME
);

const handler: Handler<IEvent> = async (event, context) => {
  const { lastEvaluatedKey, startTs, endTs, tenantId } = event;

  const results = await query({
    ExclusiveStartKey: lastEvaluatedKey,
    ExpressionAttributeValues: {
      ":messageStatus": "ENQUEUED",
      ":startTs": startTs,
      ":endTs": endTs,
      ":tenantId": tenantId,
    },
    FilterExpression: "messageStatus = :messageStatus",
    IndexName: "ByEnqueuedDateIndex",
    KeyConditionExpression:
      "tenantId = :tenantId AND enqueued BETWEEN :startTs and :endTs",
    TableName,
  });

  const { LastEvaluatedKey } = results;
  const messages = results.Items as IMessage[];

  await Promise.all(
    messages.map(async (message) => {
      try {
        const { id: messageId } = message;

        const filePath = `${message.tenantId}/prepare_${messageId}.json`;

        await enqueuePrepare({
          messageId,
          messageLocation: {
            path: filePath,
            type: "S3",
          },
          tenantId,
          type: "prepare",
        });
      } catch (err) {
        console.error(err);
      }
    })
  );

  if (LastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          lastEvaluatedKey: LastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
