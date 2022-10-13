import { SQSRecord } from "aws-lambda";
import bulk from "~/bulk-processing/services/bulk-processing";
import { ISqsBulkJob } from "~/bulk-processing/types";
import { createEventHandlerWithFailures } from "~/lib/sqs/create-event-handler";

export const handleRecord = async (record: SQSRecord) => {
  const job = (
    typeof record.body === "string" ? JSON.parse(record.body) : record.body
  ) as ISqsBulkJob;

  const {
    apiVersion,
    dryRunKey,
    jobId,
    jobPayloadPtr,
    pageSize,
    scope,
    workspaceId,
  } = job;

  await bulk(workspaceId).processJob(jobId, jobPayloadPtr, pageSize, {
    apiVersion,
    dryRunKey,
    scope,
  });
};

export default createEventHandlerWithFailures(
  handleRecord,
  process.env.BULK_JOB_WORKER_SEQUENCE_TABLE
);
