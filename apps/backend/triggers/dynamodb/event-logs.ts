import { DynamoDBRecord } from "aws-lambda";
import { Kinesis } from "aws-sdk";
import { nanoid } from "nanoid";

import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";
import dynamoToJson from "~/lib/dynamo/to-json";
import { ISafeEventLogEntry } from "~/types.internal";

const kinesis = new Kinesis();

async function handleStreamRecord(record: DynamoDBRecord) {
  const eventLog = dynamoToJson<ISafeEventLogEntry>(record.dynamodb.NewImage);

  if (record.eventName !== "INSERT") {
    return;
  }

  await kinesis
    .putRecord({
      Data: JSON.stringify(eventLog),
      PartitionKey: nanoid(),
      StreamName: process.env.EVENT_LOGS_KINESIS_STREAM,
    })
    .promise();
}

export default createStreamHandlerWithFailures(
  handleStreamRecord,
  process.env.EVENT_LOG_SEQUENCE_TABLE
);
