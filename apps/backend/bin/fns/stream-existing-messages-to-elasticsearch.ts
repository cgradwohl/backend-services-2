import AWS from "aws-sdk";
import getUnixTime from "date-fns/getUnixTime";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log from "~/lib/log";
import { scan } from "../../lib/dynamo";

const streamFnArn = process.env.MESSAGES_STREAM_HANDLER;
const TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

export const handle = async ({ next }, { functionName }) => {
  if (next) {
    log("Next:", next);
  } else {
    log("Starting new record stream");
  }

  // scan in 100 records
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
    Records: res.Items.map((item) => ({
      dynamodb: {
        ApproximateCreationDateTime: getUnixTime(new Date()),
        Keys: AWS.DynamoDB.Converter.marshall({
          id: item.id,
          tenantId: item.tenantId,
        }),
        NewImage: AWS.DynamoDB.Converter.marshall(item),
        OldImage: AWS.DynamoDB.Converter.marshall(item),
      },
      eventName: "INSERT",
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
