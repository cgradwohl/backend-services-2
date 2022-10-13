import { SQSRecord } from "aws-lambda";
import { Kinesis } from "aws-sdk";
import { nanoid } from "nanoid";
import { createEventHandlerWithFailures } from "~/lib/sqs/create-event-handler";

const kinesis = new Kinesis();

type TODOActionType = any;

async function handler(record: SQSRecord): Promise<void> {
  const payload: TODOActionType = JSON.parse(record.body);
  await kinesis
    .putRecord({
      Data: JSON.stringify(payload),
      PartitionKey: nanoid(),
      StreamName: payload.streamName,
    })
    .promise();
}

export default createEventHandlerWithFailures(
  handler,
  process.env.RETRY_MESSAGE_SEQUENCE_TABLE
);
