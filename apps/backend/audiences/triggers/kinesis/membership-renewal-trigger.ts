import { DynamoDBRecord, KinesisStreamRecord } from "aws-lambda";
import { Kinesis } from "aws-sdk";
import DynamoDB, { Key } from "aws-sdk/clients/dynamodb";
import { IDDBAudience } from "~/audiences/stores/dynamo/types";
import { createEventHandlerWithoutSequenceChecking } from "~/lib/kinesis/create-event-handler";
import kinesisToJson from "~/lib/kinesis/to-json";
import logger from "~/lib/logger";
import getEnvironmentVariable from "~/lib/get-environment-variable";
import { putRecord } from "~/lib/kinesis";
import { nanoid } from "nanoid";

const StreamName = getEnvironmentVariable("MEMBERSHIP_ITERATOR_STREAM");

export type IMembershipIteratorData = {
  audience: Pick<
    IDDBAudience,
    "audienceId" | "version" | "workspaceId" | "filter"
  >;
  eventName: DynamoDBRecord["eventName"];
  lastEvaluatedKey?: Key;
};

export interface IMembershipIteratorRecord
  extends Kinesis.Types.PutRecordInput {
  Data: IMembershipIteratorData;
  PartitionKey: string;
  StreamName: string;
}

async function handleRecord(record: KinesisStreamRecord) {
  const item = kinesisToJson<DynamoDBRecord>(record.kinesis.data);
  const eventName = item.eventName;
  const audience: IDDBAudience = DynamoDB.Converter.unmarshall(
    eventName === "REMOVE" ? item.dynamodb.OldImage : item.dynamodb.NewImage
  ) as IDDBAudience;
  // No need to recalculate the filter for a remove event
  if (eventName === "REMOVE") {
    return;
  }
  logger.debug(
    `Received ${eventName} for audience ${audience.workspaceId}/${audience.audienceId}`
  );
  await putRecord<IMembershipIteratorRecord>({
    Data: {
      audience: {
        audienceId: audience.audienceId,
        version: audience.version,
        workspaceId: audience.workspaceId,
        filter: audience.filter,
      },
      eventName,
      lastEvaluatedKey: null, // since this is first page, no lastEvaluatedKey
    },
    PartitionKey: nanoid(),
    StreamName,
  });
  logger.debug(
    `Audience ${audience.workspaceId}/${audience.audienceId} added to membership iterator`
  );
}

export default createEventHandlerWithoutSequenceChecking(handleRecord);
