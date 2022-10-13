import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import differenceInHours from "date-fns/differenceInHours";
import fromUnixTime from "date-fns/fromUnixTime";

import captureException from "~/lib/capture-exception";
import dynamoToJson from "~/lib/dynamo/to-json";
import enqueue from "~/lib/enqueue";
import { error } from "~/lib/log";

import {
  LegacySqsCheckDeliveryStatusMessage,
  SqsCheckDeliveryStatusMessage,
  SqsPrepareMessage,
  SqsRouteMessage,
} from "~/types.internal";

export type SQSRetrableMessage =
  | LegacySqsCheckDeliveryStatusMessage
  | SqsCheckDeliveryStatusMessage
  | SqsPrepareMessage
  | SqsRouteMessage;

const enqueuePrepare = enqueue<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_NAME
);
const enqueueRoute = enqueue<SqsRouteMessage>(process.env.SQS_ROUTE_QUEUE_NAME);
const enqueueCheckDeliveryStatus = enqueue<
  LegacySqsCheckDeliveryStatusMessage | SqsCheckDeliveryStatusMessage
>(process.env.SQS_CHECK_DELIVERY_STATUS_QUEUE_NAME);

const isAgedOut = (ttl: number) =>
  differenceInHours(new Date(), fromUnixTime(ttl)) > 48;

async function handleRecord(record: DynamoDBRecord) {
  try {
    if (record.eventName === "REMOVE") {
      const item = dynamoToJson<{ json: unknown; ttl: number }>(
        record.dynamodb.OldImage
      );
      const payload =
        typeof item.json === "string" ? JSON.parse(item.json) : item.json;
      // type in payload is used as a way to determine subsequent action
      if ("type" in payload) {
        switch ((payload as SQSRetrableMessage).type) {
          case "check-delivery-status":
            await enqueueCheckDeliveryStatus(payload);
            break;
          case "prepare":
            if (!isAgedOut(item.ttl)) {
              await enqueuePrepare(payload);
            }
            break;
          case "route":
            if (!isAgedOut(item.ttl)) {
              await enqueueRoute(payload);
            }
            break;
        }
      }
    }
  } catch (err) {
    error(err);
    await captureException(err);
    throw err;
  }
}

export async function handle(event: DynamoDBStreamEvent): Promise<void> {
  await Promise.all(event.Records.map(handleRecord));
}
