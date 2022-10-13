import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamodb from "~/lib/dynamo";
import { IIdempotentRequest } from "~/lib/idempotent-requests/types";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  lastEvaluatedKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    // tslint:disable-next-line: no-console
    console.log("process aborted by environment variable");
    return;
  }

  const res = await dynamodb.scan({
    ExclusiveStartKey: event.lastEvaluatedKey,
    Limit: 100,
    TableName: process.env.IDEMPOTENT_REQUESTS_TABLE_NAME,
  });

  if (!res.Items || res.Items.length === 0) {
    // tslint:disable-next-line: no-console
    console.log("No items found");
    return;
  }

  for (const item of res.Items) {
    try {
      const { body, idempotencyKey, statusCode, tenantId, ttl } =
        item as IIdempotentRequest;

      const now = Math.floor(Date.now() / 1000);

      await dynamodb.put({
        ConditionExpression: "attribute_not_exists(pk) OR #ttl < :now",
        ExpressionAttributeNames: {
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":now": now,
        },
        Item: {
          body,
          idempotencyKey,
          pk: `${tenantId}/${idempotencyKey}`,
          statusCode,
          tenantId,
          ttl,
        },
        TableName: process.env.IDEMPOTENT_REQUESTS_V2_TABLE_NAME,
      });
    } catch (err) {
      // tslint:disable-next-line: no-console
      console.error(
        `Failed to migrate item with idempotencyKey ${item.idempotencyKey} in tenant ${item.tenantId}`,
        err
      );
    }
  }

  if (res.LastEvaluatedKey) {
    // call this function again but do not wait for response
    await lambda
      .invoke({
        FunctionName: context.functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({
          ...event,
          lastEvaluatedKey: res.LastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
