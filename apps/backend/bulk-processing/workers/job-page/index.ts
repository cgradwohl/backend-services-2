import { SQSRecord } from "aws-lambda";
import bulk from "~/bulk-processing/services/bulk-processing";
import { ISqsBulkJobPage } from "~/bulk-processing/types";
import { createEventHandlerWithFailures } from "~/lib/sqs/create-event-handler";

export const handleRecord = async (record: SQSRecord) => {
  const page = (
    typeof record.body === "string" ? JSON.parse(record.body) : record.body
  ) as ISqsBulkJobPage;

  const {
    apiVersion,
    jobId,
    dryRunKey,
    jobPayloadPtr,
    pageSize,
    scope,
    shard,
    workspaceId,
    lastProcessedRecordPtr,
  } = page;

  await bulk(workspaceId).processJobPage(
    jobId,
    jobPayloadPtr,
    pageSize,
    shard,
    { apiVersion, dryRunKey, scope },
    lastProcessedRecordPtr
  );
};

export default createEventHandlerWithFailures(
  handleRecord,
  process.env.BULK_JOB_PAGE_WORKER_SEQUENCE_TABLE
);
