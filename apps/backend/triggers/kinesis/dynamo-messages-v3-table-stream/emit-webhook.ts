import { DynamoDBRecord } from "aws-lambda";
import { EventBridge } from "aws-sdk";
import { PutEventsRequest } from "aws-sdk/clients/eventbridge";
import toJson from "~/lib/dynamo/to-json";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import createMessages from "~/lib/message-service/create-messages";

type DynamoDBRecordV2 = DynamoDBRecord & { tableName: string };

const eventbridge = new EventBridge();

const shouldProcess = (record: DynamoDBRecordV2): boolean => {
  const { dynamodb } = record;
  const { NewImage, OldImage } = dynamodb;

  if (
    (toJson(NewImage) as any)?.messageStatus ===
    (toJson(OldImage) as any)?.messageStatus
  ) {
    return false;
  }

  return true;
};

const handleRecord = async (record: DynamoDBRecordV2) => {
  const { dynamodb, eventName, tableName } = record;
  const { NewImage } = dynamodb;

  // keeping this just as a safety precaution. this should never happen.
  if (!shouldProcess(record)) {
    return;
  }

  const message = toJson(NewImage) as any;
  const { tenantId, id: messageId, messageStatus: status } = message;

  const [data] = await createMessages(
    tenantId,
    [{ ...message, messageId, status }],
    true
  );

  const putEventsRequest: PutEventsRequest = {
    Entries: [
      {
        Detail: JSON.stringify({
          data,
          type: "message:updated",
          tenantId,
          eventName,
        }),
        DetailType: `table.${tableName}`,
        EventBusName: process.env.COURIER_EVENT_BUS_NAME,
        Source: "courier.dynamo.messagesv3",
      },
    ],
  };

  await eventbridge.putEvents(putEventsRequest).promise();
};

export default createEventHandlerWithFailures<DynamoDBRecordV2>(
  handleRecord,
  process.env.MESSAGE_SEQUENCE_TABLE,
  {
    filter: (record: DynamoDBRecordV2) => shouldProcess(record),
  }
);
