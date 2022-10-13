import { Handler, KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";
import { AWSError } from "aws-sdk";
import captureException from "~/lib/capture-exception";
import { sequenceService } from "~/lib/dynamo/sequence-service";
import { InvalidSequenceTableNameError } from "~/lib/errors";
import kinesisToJson from "~/lib/kinesis/to-json";
import { error } from "~/lib/log";
import { SequenceAlreadyProcessedError } from "../dynamo/sequence-service/errors";

//TODO Remove when cleaning up dynamo/kinesis create handlers
const createEventHandler = <T>(handleFn) => {
  const handleRecord = async (record: KinesisStreamRecord) => {
    try {
      const item = kinesisToJson<T>(record.kinesis.data);
      await handleFn(item, record);
    } catch (err) {
      if ((err as AWSError)?.retryable === false) {
        console.error(
          "Sequence Processing Failed. This error is not retryable",
          err
        );
        await captureException(err);
        return;
      }

      error(err);
      await captureException(err);
      throw err;
    }
  };

  return async (event: KinesisStreamEvent) => {
    await Promise.all(event.Records.map(handleRecord));
  };
};

export default createEventHandler;

export type KinesisStreamBisectHandler = Handler<
  KinesisStreamEvent,
  void | { batchItemFailures: Array<{ itemIdentifier: string }> }
>;

export const createEventHandlerWithoutSequenceChecking = (
  handleFn: (item: KinesisStreamRecord) => Promise<void>
): KinesisStreamBisectHandler => {
  return async (event) => {
    const failedSequences: string[] = [];

    await Promise.all(
      event.Records.map(async (record) => {
        const sequenceNumber = record.kinesis.sequenceNumber;
        try {
          await handleFn(record);
        } catch (err) {
          if ((err as AWSError)?.retryable === false) {
            console.error(
              "Sequence Processing Failed. This error is not retryable",
              err
            );
            await captureException(err);
            return;
          }

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

export const createEventHandlerWithFailures = <T>(
  handleFn: (item: T) => Promise<void>,
  sequenceTableName: string,
  options?: { filter?: (item: T) => boolean }
): KinesisStreamBisectHandler => {
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
        const sequenceNumber = record.kinesis.sequenceNumber;
        try {
          const item = kinesisToJson<T>(record.kinesis.data);
          const filter = options?.filter?.(item) ?? true;

          if (filter) {
            await putSequence(sequenceNumber);
            await handleFn(item);
          }
        } catch (err) {
          if (err && err instanceof SequenceAlreadyProcessedError) {
            return;
          }

          if ((err as AWSError)?.retryable === false) {
            console.error(
              "Sequence Processing Failed. This error is not retryable",
              err
            );
            await captureException(err);
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
