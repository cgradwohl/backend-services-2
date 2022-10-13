import { Handler, SQSEvent, SQSRecord } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import { sequenceService } from "~/lib/dynamo/sequence-service";
import { SequenceAlreadyProcessedError } from "~/lib/dynamo/sequence-service/errors";
import {
  InvalidSequenceTableNameError,
  PartialBatchProcessingError,
} from "~/lib/errors";
import logger from "~/lib/logger";
import { logBeforeTimeout } from "~/lib/lambda/timeout-middleware";

export type SQSEventHandler = Handler<SQSEvent, void>;
type TimeoutRecord = { messageId: string; tenantId: string };

export const createEventHandlerWithFailures = (
  handleFn: (item: SQSRecord) => Promise<void>,
  sequenceTableName: string
): SQSEventHandler => {
  if (!sequenceTableName) {
    throw new InvalidSequenceTableNameError();
  }

  return async (event, { functionName, getRemainingTimeInMillis }) => {
    const { logContext, timeoutId } = logBeforeTimeout(
      functionName,
      getRemainingTimeInMillis()
    );

    const { deleteSequence, putSequence } = sequenceService(
      sequenceTableName,
      functionName
    );

    const allRecords = await Promise.allSettled(
      event.Records.map(async (record) => {
        const sequenceNumber = record.messageId;
        try {
          await putSequence(sequenceNumber);
          // update timeout context before calling the handler
          // message should atleast have messageId and tenantId in the record body
          // this is currently the case for SQS messages for Route and Prepare
          const message: TimeoutRecord =
            typeof record.body === "string"
              ? JSON.parse(record.body)
              : record.body;
          logContext.updateContext(message.tenantId, message.messageId);
          // call the handler
          await handleFn(record);
        } catch (err) {
          if (err && err instanceof SequenceAlreadyProcessedError) {
            return;
          }
          // tslint:disable-next-line: no-console
          console.error("Sequence Processing Failed", err);
          await deleteSequence(sequenceNumber);
          logger.debug(record);
          await captureException(err);
          throw err;
        }
      })
    );
    // clear the timeout context
    clearTimeout(timeoutId);
    logContext.flushContext();

    const failedRecords = allRecords.filter((r) => r.status === "rejected");

    // throw an error to keep the failed records on the queue
    if (failedRecords.length) {
      // tslint:disable-next-line: no-console
      console.error("Partial Batch Processing Failed");
      throw new PartialBatchProcessingError(
        `${failedRecords.length} out of ${allRecords.length} records failed`
      );
    }
  };
};
