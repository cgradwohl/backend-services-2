import { getHashFromRange } from "../../lib/get-hash-from-range";
import { PARTITION_SHARD_RANGE } from "../services/bulk-processing";
import { IBulkMessageUser, IDynamoBulkMessageUser } from "../types";

export const createUserPk = (
  workspaceId: string,
  jobId: string,
  userId: string
) => `${workspaceId}/bulk/${jobId}/user/${userId}`;

export const createUserGsiPk = (
  workspaceId: string,
  jobId: string,
  shard?: number
) => {
  const shardValue = shard ?? getHashFromRange(PARTITION_SHARD_RANGE);
  return `${workspaceId}/bulk/${jobId}/${shardValue}`;
};

export const toDynamoUser = (
  workspaceId: string,
  jobId: string,
  user: IBulkMessageUser
): IDynamoBulkMessageUser => {
  if (!workspaceId || !jobId || !user) {
    return;
  }
  const { userId } = user;

  return {
    ...user,
    gsi1pk: createUserGsiPk(workspaceId, jobId),
    pk: createUserPk(workspaceId, jobId, userId),
  };
};
