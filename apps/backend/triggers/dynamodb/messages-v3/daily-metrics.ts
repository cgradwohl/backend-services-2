import { DynamoDBRecord } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import { incrementMetrics } from "~/lib/daily-metrics-service";
import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";
import dynamoToJson from "~/lib/dynamo/to-json";
import { error } from "~/lib/log";
import { CourierLogger } from "~/lib/logger";
import { PartialMessage } from "~/types.api";

interface IMessageDynamo {
  clicked?: number;
  delivered?: number;
  messageId: string;
  messageStatus: PartialMessage["status"];
  opened?: number;
  provider?: string;
  sent?: number;
  tenantId: string;
}

const shouldProcess = (record: DynamoDBRecord): boolean => {
  const { logger } = new CourierLogger("shouldProcess");
  const message = dynamoToJson<IMessageDynamo>(record.dynamodb.NewImage);
  const previous = dynamoToJson<IMessageDynamo>(record.dynamodb.OldImage);

  if (message.messageStatus === previous.messageStatus) {
    return false;
  }

  switch (message.messageStatus) {
    case "CLICKED":
      if (!message.clicked) {
        logger.warn("Cannot increment clicked metric without a date");
        return false;
      }

      break;
    case "OPENED":
      if (!message.opened) {
        logger.warn("Cannot increment opened metric without a date");
        return false;
      }

      break;
    case "SENT":
    case "UNDELIVERABLE":
      if (!message.sent) {
        logger.warn(
          "Cannot decrement or increment undeliverable metric without a date"
        );
        return false;
      }
  }

  return true;
};

async function handleStreamRecord(record: DynamoDBRecord) {
  try {
    // keeping this just as a safety precaution. this should never happen.
    if (!shouldProcess(record)) {
      return;
    }

    const message = dynamoToJson<IMessageDynamo>(record.dynamodb.NewImage);
    const previous = dynamoToJson<IMessageDynamo>(record.dynamodb.OldImage);

    const { clicked, opened, tenantId, provider, sent } = message;

    switch (message.messageStatus) {
      case "CLICKED":
        await incrementMetrics(tenantId, clicked, `${provider}_clicked`);
        break;

      // Case DELIVERED does not exist in today's system because there isn't a way
      // to go SENT -> UNDELIVERABLE -> DELIVERED.
      // If we ever add a way to recheck undelivered messages between SENT and
      // DELIVERED, we can revisit this case.

      case "OPENED":
        await incrementMetrics(tenantId, opened, `${provider}_opened`);
        break;

      case "SENT":
        if (previous.messageStatus === "UNDELIVERABLE") {
          // if an undeliverable message becomes sent, decrement the metric count by 1
          await incrementMetrics(previous.tenantId, previous.sent, [
            "undeliverable",
            -1,
          ]);
        }
        break;

      case "UNDELIVERABLE":
        await incrementMetrics(tenantId, sent, "undeliverable");
        break;
    }
  } catch (err) {
    error(err);
    await captureException(err);
    throw err;
  }
}

export default createStreamHandlerWithFailures(
  handleStreamRecord,
  process.env.MESSAGE_SEQUENCE_TABLE,
  {
    filter: (record: DynamoDBRecord) => shouldProcess(record),
  }
);
