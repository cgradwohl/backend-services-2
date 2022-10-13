import { DynamoDBRecord } from "aws-lambda";
import { Kinesis } from "aws-sdk";
import { nanoid } from "nanoid";
import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";
import dynamoToJson from "~/lib/dynamo/to-json";
import logger from "~/lib/logger";
const kinesis = new Kinesis();

type TODOActionType = any;

async function handler(record: DynamoDBRecord): Promise<void> {
  if (record.eventName === "REMOVE") {
    const payload: TODOActionType = dynamoToJson<TODOActionType>(
      record.dynamodb.OldImage
    );
    logger.debug(`Sending to kinesis ${JSON.stringify(payload)}`);

    await kinesis
      .putRecord({
        Data: JSON.stringify(payload),
        PartitionKey: nanoid(),
        StreamName: payload.streamName,
      })
      .promise();
  }
}

export default createStreamHandlerWithFailures(
  handler,
  process.env.RETRY_MESSAGE_SEQUENCE_TABLE
);
