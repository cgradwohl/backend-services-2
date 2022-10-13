import { addHours } from "date-fns";
import * as dynamodb from "..";
import { UnableToAcquireLock } from "./errors";

// add your feature (ex: Billing rollout)
export enum PURPOSE {
  GENERAL = "general",
}

export enum RELEASE_MODE {
  AUTO = "auto", // 48 hours
  EXPLICIT = "explicit",
}

const LOCK_TABLE = process.env.LOCK_TABLE;
const LOCK_TTL = 48;

export const lockService = (purpose: PURPOSE) => ({
  acquire: async (key: string, releaseMode: RELEASE_MODE) => {
    const ttlMs = addHours(new Date(), LOCK_TTL).getTime();
    const ttl = Math.floor(ttlMs / 1000);

    try {
      await dynamodb.put({
        ConditionExpression:
          "attribute_not_exists(lockKey) AND attribute_not_exists(purpose)",
        Item: {
          lockKey: key,
          purpose,
          ...(releaseMode === RELEASE_MODE.AUTO && { ttl }),
        },
        TableName: LOCK_TABLE,
      });
    } catch (err) {
      if (err?.code === "ConditionalCheckFailedException") {
        throw new UnableToAcquireLock();
      }
      throw err;
    }

    return true;
  },

  release: async (key: string) => {
    await dynamodb.deleteItem({
      Key: {
        lockKey: key,
        purpose,
      },
      TableName: LOCK_TABLE,
    });
  },
});
