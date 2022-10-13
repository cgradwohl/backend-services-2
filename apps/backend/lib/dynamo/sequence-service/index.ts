import { addHours } from "date-fns";
import * as dynamodb from "..";
import { SequenceAlreadyProcessedError } from "./errors";

const SEQUENCE_TTL = 48; // 48 hours

export const sequenceService = (tableName: string, lambdaFunction: string) => ({
  deleteSequence: async (sequenceNumber: string) => {
    await dynamodb.deleteItem({
      Key: {
        lambdaFunction,
        sequenceNumber,
      },
      TableName: tableName,
    });
  },
  putSequence: async (sequenceNumber: string) => {
    const ttlMs = addHours(new Date(), SEQUENCE_TTL).getTime();
    const ttl = Math.floor(ttlMs / 1000); // dynamo expects epoch seconds

    try {
      await dynamodb.put({
        ConditionExpression:
          "attribute_not_exists(sequenceNumber) AND attribute_not_exists(lambdaFunction)",
        Item: {
          lambdaFunction,
          sequenceNumber,
          ttl,
        },
        TableName: tableName,
      });
    } catch (err) {
      if (err?.code === "ConditionalCheckFailedException") {
        throw new SequenceAlreadyProcessedError();
      }
      throw err;
    }
  },
});
