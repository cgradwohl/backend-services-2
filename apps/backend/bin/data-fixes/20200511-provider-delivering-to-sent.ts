import { Context } from "aws-lambda";
import AWS from "aws-sdk";

import { scan, update } from "~/lib/dynamo";
import log from "~/lib/log";

const TableName = process.env.EVENT_LOGS_TABLE_NAME;

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

export const handle = async (event: any, context: Context) => {
  const { next } = event;
  const { functionName } = context;

  if (next) {
    log("Next:", next);
  } else {
    log("Starting new record stream");
  }

  const res = await scan({
    ExclusiveStartKey: next,
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":providerDelivering": "provider:delivering",
    },
    FilterExpression: "#type = :providerDelivering",
    Limit: 100,
    TableName,
  });

  const { LastEvaluatedKey } = res;
  const eventLogs = res.Items;

  for (const item of eventLogs) {
    await update({
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":providerSent": "provider:sent",
      },
      Key: {
        id: item.id,
        tenantId: item.tenantId,
      },
      TableName,
      UpdateExpression: "SET #type = :providerSent",
    });
  }

  // more records to scan?
  if (LastEvaluatedKey) {
    log(`More records to scan. Calling ${functionName} again...`);
    // call this function again but do not wait for response
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({ next: res.LastEvaluatedKey }),
      })
      .promise();
  }
};
