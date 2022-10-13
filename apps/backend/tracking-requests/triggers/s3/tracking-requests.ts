import { S3Event, S3EventRecord } from "aws-lambda";
import { Kinesis } from "aws-sdk";
import { nanoid } from "nanoid";
import jsonStore from "../../stores/json";
import { ITrackingRequest } from "../../types";

const kinesis = new Kinesis();

const getObject = async (record: S3EventRecord): Promise<ITrackingRequest> =>
  jsonStore.get(record.s3.object.key);

const handleRecord = async (record: S3EventRecord) => {
  const { scope, tenantId, trackingId } = await getObject(record);

  await kinesis
    .putRecord({
      Data: JSON.stringify({ scope, tenantId, trackingId }),
      PartitionKey: nanoid(),
      StreamName: process.env.TRACKING_REQUEST_KINESIS_STREAM,
    })
    .promise();
};

const worker = async (event: S3Event) => {
  await Promise.all(event.Records.map(handleRecord));
};

export { worker };
