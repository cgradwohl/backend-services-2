import { DynamoDBRecord } from "aws-lambda";
import toJson from "~/lib/dynamo/to-json";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { trackUsage } from "~/lib/tenant-service";

interface IMessage {
  billed_units: number;
  messageId: string;
  tenantId: string;
}

const shouldProcess = (record: DynamoDBRecord): boolean => {
  const { dynamodb } = record;
  const { NewImage, OldImage } = dynamodb;

  if (
    toJson<IMessage>(NewImage)?.billed_units ===
    toJson<IMessage>(OldImage)?.billed_units
  ) {
    return false;
  }

  return true;
};

const handleRecord = async (record: DynamoDBRecord) => {
  // keeping this just as a safety precaution. this should never happen.
  if (!shouldProcess(record)) {
    return;
  }

  const message = toJson<IMessage>(record.dynamodb.NewImage);
  const { billed_units: billedUnits, messageId, tenantId } = message;

  await trackUsage({ billedUnits, tenantId });
};

export default createEventHandlerWithFailures<DynamoDBRecord>(
  handleRecord,
  process.env.MESSAGE_SEQUENCE_TABLE,
  {
    filter: (record: DynamoDBRecord) => shouldProcess(record),
  }
);
