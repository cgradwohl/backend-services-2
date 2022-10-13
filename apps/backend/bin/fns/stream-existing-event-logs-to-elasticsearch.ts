import { Context } from "aws-lambda";
import AWS from "aws-sdk";

import { scan } from "~/lib/dynamo";
import log from "~/lib/log";

const streamFnArn = process.env.EVENT_LOG_STREAM_HANDLER;
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
    Limit: 100,
    TableName,
  });

  if (!res.Items || res.Items.length === 0) {
    log("No items found");
    return;
  }

  // create a stream event record
  const streamEvent = {
    Records: res.Items.map(item => ({
      kinesis: {
        data: Buffer.from(JSON.stringify(item)).toString("base64"),
      },
    })),
  };

  log(`Streaming ${streamEvent.Records.length} items`);

  // invoke the stream function
  await lambda
    .invoke({
      FunctionName: streamFnArn,
      Payload: JSON.stringify(streamEvent),
    })
    .promise();

  // more records to scan?
  if (res.LastEvaluatedKey) {
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
