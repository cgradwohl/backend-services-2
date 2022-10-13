import { IDDBAudienceCalculation } from "~/audiences/stores/dynamo/types";
import { AudienceWithoutDDBKeys } from "~/audiences/services";
import { updateItem } from "~/audiences/stores/dynamo";
import { createAudienceCalcStatusPk } from "~/audiences/util/dynamo";

export async function updateAudienceCalculation(
  audienceFromDdb: AudienceWithoutDDBKeys,
  totalUsers: number,
  totalUsersFiltered: number,
  result: IDDBAudienceCalculation["result"]
) {
  const timestamp = new Date().toISOString();

  const ExpressionAttributeNames = {
    "#audienceId": "audienceId",
    "#lastUpdatedAt": "lastUpdatedAt",
    "#result": "result",
    "#totalUsers": "totalUsers",
    "#totalUsersFiltered": "totalUsersFiltered",
    "#workspaceId": "workspaceId",
  };

  const ExpressionAttributeValues = {
    ":audienceId": audienceFromDdb.audienceId,
    ":lastUpdatedAt": timestamp,
    ":result": result,
    ":workspaceId": audienceFromDdb.workspaceId,
    ":start": 0,
    ":increment": totalUsers ?? 0,
    ":totalUsersFiltered": totalUsersFiltered,
  };

  const UpdateExpression = [
    "SET #audienceId = :audienceId",
    "#lastUpdatedAt = :lastUpdatedAt",
    "#result = :result",
    "#totalUsers = if_not_exists(#totalUsers, :start) + :increment",
    "#totalUsersFiltered = if_not_exists(#totalUsersFiltered, :start) + :totalUsersFiltered",
    "#workspaceId = :workspaceId",
  ].join(", ");

  const Key = createAudienceCalcStatusPk(
    audienceFromDdb.audienceId,
    audienceFromDdb.workspaceId,
    audienceFromDdb.version
  );

  await updateItem({
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    Key,
    UpdateExpression,
  });
}
