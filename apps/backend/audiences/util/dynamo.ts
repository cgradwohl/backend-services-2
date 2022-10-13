import getEnvVar from "~/lib/get-environment-variable";

export const AUDIENCE_INDEX_NAME = "gsi1";
export const MEMBER_INDEX_NAME = "gsi2";
export const AUDIENCES_TABLE_NAME = getEnvVar("AUDIENCES_TABLE_NAME");

export const PARTITION_SHARD_RANGE = 10;

export function createAudiencePk(audienceId: string, workspaceId: string) {
  return {
    pk: `a/${workspaceId}/${audienceId}`,
  };
}

export function createAudienceGsi1Pk(shardId: number, workspaceId: string) {
  return {
    gsi1pk: `a/${workspaceId}/${shardId}`,
  };
}

export function createAudienceMemberPk(
  audienceId: string,
  userId: string,
  version: number,
  workspaceId: string
) {
  return {
    pk: `a_m/${workspaceId}/${audienceId}/${version}/${userId}`,
  };
}

export function createAudienceMemberGsi1Pk(
  audienceId: string,
  shardId: number,
  version: number,
  workspaceId: string
) {
  return {
    gsi1pk: `a_m/${workspaceId}/${audienceId}/${version}/${shardId}`,
  };
}

export function createUserAudiencesGsi2Pk(
  shardId: number,
  userId: string,
  workspaceId: string
) {
  return {
    gsi2pk: `a_u/${workspaceId}/${userId}/${shardId}`,
  };
}

export function createAudienceCalcStatusPk(
  audienceId: string,
  workspaceId: string,
  version: number
) {
  return {
    pk: `a_cal_status/${workspaceId}/${audienceId}/${version}`,
  };
}
