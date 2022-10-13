import {
  PutRecordInput,
  PutRecordsRequestEntry,
} from "aws-sdk/clients/kinesis";
import AWS from "~/lib/aws-sdk";

const kinesis = new AWS.Kinesis();

export async function putRecord<T extends PutRecordInput>(record: T) {
  await kinesis
    .putRecord({
      Data: JSON.stringify(record.Data),
      PartitionKey: record.PartitionKey,
      StreamName: record.StreamName,
    })
    .promise();
}

export async function putRecords(
  records: PutRecordsRequestEntry[],
  streamName: string
) {
  await kinesis
    .putRecords({
      Records: records.map((record) => ({
        ...record,
        Data: JSON.stringify(record.Data),
      })),
      StreamName: streamName,
    })
    .promise();
}
