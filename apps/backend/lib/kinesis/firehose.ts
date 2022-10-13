import uuid from "uuid";
import { PutRecordInput } from "aws-sdk/clients/firehose";
import AWS from "aws-sdk";

const firehose = new AWS.Firehose();

interface IPutRecordOptions {
  /** indicates whether to chunk a record or not */
  chunkRecord?: boolean;
  /** indicates the size of chunk to use */
  chunkSize?: number;
}

/** 900 KB */
const DEFAULT_CHUNK_SIZE = 1000 * 975;

function chunkRecordForFirehose<T extends PutRecordInput>(
  inputRecord: T,
  chunkSize: number
): PutRecordInput[] {
  const recordData = inputRecord.Record.Data as string;
  const numChunks = Math.ceil(recordData.length / chunkSize);

  const kinesisRecordId = uuid.v4();

  let chunks = Array();

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, recordData.length);
    chunks.push({
      DeliveryStreamName: inputRecord.DeliveryStreamName,
      Record: {
        Data: JSON.stringify({
          kinesisRecordId: kinesisRecordId,
          kinesisSequenceNumber: i,
          kinesisSequenceTotal: numChunks,
          chunk: recordData.substring(start, end),
        }),
      },
    });
  }
  return chunks;
}

/** puts a record into kinesis for later firehose consumption.
 * By default, generates a new record uuid
 * and chunks the stringified record for sequential kinesis writes
 * if necessary.
 */
export async function putRecord<T extends PutRecordInput>(
  record: T,
  putRecordOpts?: IPutRecordOptions
) {
  const shouldChunk = putRecordOpts?.chunkRecord ?? true;
  if (!shouldChunk) {
    await firehose.putRecord(record).promise();
    return;
  }

  const chunkSize = putRecordOpts?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  for (const chunk of chunkRecordForFirehose(record, chunkSize)) {
    await firehose.putRecord(chunk).promise();
  }
}
