import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import chunkArray from "~/lib/chunk-array";
import * as dynamodb from "~/lib/dynamo";
import logger from "~/lib/logger";
import { Handler, IDataFixEvent } from "./types";

const TableName = process.env.DELIVERY_STATUS_TABLE_NAME;

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  tenantId: string;
  type: "prepare" | "route";
  exclusiveStartKey?: DocumentClient.Key;
}

async function batchDelete(tenantId, ids: string[]) {
  const batches = chunkArray(ids, 25);

  await Promise.all(
    batches.map(async (batch) => {
      return dynamodb.batchWrite({
        RequestItems: {
          [TableName]: batch.map((id) => {
            return {
              DeleteRequest: {
                Key: { id, tenantId },
              },
            };
          }),
        },
      });
    })
  );
}

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  logger.debug(
    `force-retry-messages by deleting them: ${JSON.stringify(event)}`
  );

  if (!TableName) {
    throw new Error("DELIVERY_STATUS_TABLE_NAME is not set");
  }

  const response = await dynamodb.query({
    ExclusiveStartKey: event.exclusiveStartKey,
    ExpressionAttributeNames: {
      "#id": "id",
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":id": `${event.type}`,
      ":tenantId": event.tenantId,
    },
    KeyConditionExpression: "#tenantId = :tenantId AND begins_with(#id, :id)",
    Limit: 1000,
    TableName,
  });

  if (!response.Items) {
    logger.debug(`Yay!! Cleared retried all ${event.type}`);
    return null;
  }

  await batchDelete(
    event.tenantId,
    response.Items.map((item) => item.id)
  );

  if (response.LastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: response.LastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
