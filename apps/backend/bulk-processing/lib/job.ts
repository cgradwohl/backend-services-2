import { getHashFromRange } from "../../lib/get-hash-from-range";
import { PARTITION_SHARD_RANGE } from "../services/bulk-processing";
import { IBulkJob, IDynamoBulkJob } from "../types";

export const createBulkJobPk = (workspaceId: string, jobId: string) =>
  `${workspaceId}/bulk/${jobId}`;

export const createBulkJobGsiPk = (workspaceId: string, shard?: string) => {
  const shardValue = shard ?? getHashFromRange(PARTITION_SHARD_RANGE);
  return `bulk/${workspaceId}/${shardValue}`;
};

export const fromBulkJob = (job: IBulkJob): IDynamoBulkJob => {
  if (!job) {
    return;
  }
  const { jobId, created, workspaceId } = job;

  return {
    ...job,
    gsi1pk: createBulkJobGsiPk(workspaceId),
    gsi1sk: created,
    pk: createBulkJobPk(workspaceId, jobId),
  };
};
