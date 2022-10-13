import { DynamoDBRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { updateItem } from "~/audiences/stores/dynamo";
import { IDDBAudienceMember } from "~/audiences/stores/dynamo/types";
import { createAudienceCalcStatusPk } from "~/audiences/util/dynamo";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";

async function handler(record: DynamoDBRecord) {
  const payload = DynamoDB.Converter.unmarshall(
    record.eventName === "REMOVE"
      ? record.dynamodb.OldImage
      : record.dynamodb.NewImage
  ) as IDDBAudienceMember;

  const timestamp = new Date(Date.now()).toISOString();

  const ExpressionAttributeNames = {
    "#audienceId": "audienceId",
    "#lastUpdatedAt": "lastUpdatedAt",
    "#userCount": "userCount",
    "#workspaceId": "workspaceId",
  };

  const ExpressionAttributeValues = {
    ":audienceId": payload.audienceId,
    ":lastUpdatedAt": timestamp,
    ":start": 0,
    ":increment": record.eventName === "REMOVE" ? -1 : 1,
    ":workspaceId": payload.workspaceId,
  };

  const UpdateExpression = [
    "SET #audienceId = :audienceId",
    "#lastUpdatedAt = :lastUpdatedAt",
    "#userCount = if_not_exists(#userCount, :start) + :increment",
    "#workspaceId = :workspaceId",
    ...(record.eventName === "REMOVE"
      ? [
          "#totalUsers = #totalUser + :increment",
          "#totalUsersFiltered = #totalUsersFiltered + :increment",
        ]
      : []),
  ].join(", ");

  const Key = createAudienceCalcStatusPk(
    payload.audienceId,
    payload.workspaceId,
    payload.audienceVersion
  );

  await updateItem<IDDBAudienceMember>({
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    Key,
    UpdateExpression,
  });
}

export default createEventHandlerWithFailures<DynamoDBRecord>(
  handler,
  process.env.MEMBERSHIP_ITERATOR_STREAM_SEQUENCE_TABLE
);
