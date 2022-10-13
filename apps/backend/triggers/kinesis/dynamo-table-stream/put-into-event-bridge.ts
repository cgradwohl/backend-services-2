import {
  DynamoDBRecord,
  KinesisStreamEvent,
  KinesisStreamRecord,
} from "aws-lambda";
import { AWSError, EventBridge } from "aws-sdk";
import { PutEventsRequest } from "aws-sdk/clients/eventbridge";

import toJson from "~/lib/dynamo/to-json";
import kinesisToJson from "~/lib/kinesis/to-json";

interface FannedOutDynamoDBRecord {
  NewImage?: DynamoDBRecord["dynamodb"]["NewImage"];
  OldImage?: DynamoDBRecord["dynamodb"]["OldImage"];
  eventName: DynamoDBRecord["eventName"];
  table: string;
}
type DynamoDBDRecordV2 = DynamoDBRecord & { tableName: string };
type IncomingDynamoDBRecord = FannedOutDynamoDBRecord | DynamoDBDRecordV2;

const eventbridge = new EventBridge();

function assertRecordIsFannedOut(
  record: IncomingDynamoDBRecord
): record is FannedOutDynamoDBRecord {
  return "NewImage" in record || "OldImage" in record;
}

async function processRecords(records: KinesisStreamRecord[]) {
  const dynamoDbRecords = records
    .map((record) => {
      const data = kinesisToJson<IncomingDynamoDBRecord>(record.kinesis.data);

      // Do not change unless well tested
      return assertRecordIsFannedOut(data) ? undefined : data;
    })
    .filter(Boolean);

  if (!dynamoDbRecords.length) {
    return;
  }

  const putEventsRequest: PutEventsRequest = {
    Entries: dynamoDbRecords.map(({ dynamodb, eventName, tableName }) => ({
      Detail: JSON.stringify({
        NewImage: toJson(dynamodb.NewImage),
        OldImage: toJson(dynamodb.OldImage),
        eventName,
      }),
      DetailType: `table.${tableName}`,
      EventBusName: process.env.COURIER_EVENT_BUS_NAME,
      Source: "courier.dynamo.firehose",
    })),
  };

  try {
    await eventbridge.putEvents(putEventsRequest).promise();
  } catch (err) {
    const statusCode = (err as AWSError).statusCode;
    if (statusCode >= 400 && statusCode < 500) {
      // Swallow for now, move to S3 in the future
      console.error(
        "Error putting payload on to event bridge",
        putEventsRequest,
        err
      );
      return;
    }
    throw err;
  }
}

export async function handle(event: KinesisStreamEvent) {
  await processRecords(event.Records);
}
