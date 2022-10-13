import { DynamoDBRecord, DynamoDBStreamEvent, Handler } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import { sequenceService } from "~/lib/dynamo/sequence-service";
import { InvalidSequenceTableNameError } from "~/lib/errors";
import { SequenceAlreadyProcessedError } from "./sequence-service/errors";

export type DynamoBisectStreamHandler = Handler<
  DynamoDBStreamEvent,
  void | { batchItemFailures: Array<{ itemIdentifier: string }> }
>;

export const createStreamHandlerWithoutSequenceChecking = (
  handleFn: (item: DynamoDBRecord) => Promise<void>
): DynamoBisectStreamHandler => {
  return async (event) => {
    const failedSequences: string[] = [];

    await Promise.all(
      event.Records.map(async (record) => {
        const sequenceNumber = record.dynamodb.SequenceNumber;
        try {
          await handleFn(record);
        } catch (err) {
          failedSequences.push(sequenceNumber);
          console.error("Sequence Processing Failed", err);
          await captureException(err);
          throw err;
        }
      })
    );

    return {
      batchItemFailures: failedSequences.map((itemIdentifier) => ({
        itemIdentifier,
      })),
    };
  };
};

export const createStreamHandlerWithFailures = (
  handleFn: (item: DynamoDBRecord) => Promise<void>,
  sequenceTableName: string,
  options?: { filter?: (item: DynamoDBRecord) => boolean }
): DynamoBisectStreamHandler => {
  if (!sequenceTableName) {
    throw new InvalidSequenceTableNameError();
  }

  return async (event, { functionName }) => {
    const failedSequences: string[] = [];
    const { deleteSequence, putSequence } = sequenceService(
      sequenceTableName,
      functionName
    );

    await Promise.allSettled(
      event.Records.map(async (record) => {
        const sequenceNumber = record.dynamodb.SequenceNumber;
        try {
          const filter = options?.filter?.(record) ?? true;

          if (filter) {
            await putSequence(sequenceNumber);
            await handleFn(record);
          }
        } catch (err) {
          if (err instanceof SequenceAlreadyProcessedError) {
            return;
          }

          failedSequences.push(sequenceNumber);
          console.error("Sequence Processing Failed", err);
          await deleteSequence(sequenceNumber);
          await captureException(err);
          throw err;
        }
      })
    );

    return {
      batchItemFailures: failedSequences.map((itemIdentifier) => ({
        itemIdentifier,
      })),
    };
  };
};
