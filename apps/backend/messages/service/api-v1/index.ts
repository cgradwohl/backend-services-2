import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getItem, put, query, update as updateItem } from "~/lib/dynamo";
import { paginateAcrossShards } from "~/lib/dynamo/paginate-across-shards";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import { AlreadyExistsSendError, InternalSendError } from "~/send/errors";
import {
  IMessage,
  IMessagesV3Service,
  Message,
} from "../../types/api-v1/message";
import { MessageNotFoundError } from "./errors";

// PARTITION_SHARD_RANGE - the range of partition shards
const PARTITION_SHARD_RANGE = parseInt(
  process.env.PARTITION_SHARD_RANGE ?? "10",
  10
);

const PAGE_SIZE = 100;

export default (tenantId: string): IMessagesV3Service => {
  return {
    create: async (message: Message) => {
      const shard = getHashFromRange(PARTITION_SHARD_RANGE);
      const item = message.toItem(shard);

      try {
        await put({
          Item: item,
          ConditionExpression: "attribute_not_exists(pk)",
          TableName: process.env.MESSAGES_V3_TABLE,
        });
      } catch (err) {
        if (err?.code === "ConditionalCheckFailedException") {
          console.warn(
            `Duplicate pk detected: ${item.pk}`,
            JSON.stringify(item, null, 2)
          );
          throw new AlreadyExistsSendError(err, {
            eventId: item?.eventId,
            messageId: item?.messageId,
            tenantId: item?.tenantId,
          });
        }

        throw new InternalSendError(err, {
          eventId: item?.eventId,
          messageId: item?.messageId,
          tenantId: item?.tenantId,
        });
      }
    },

    get: async (messageId: string) => {
      const result = await getItem({
        Key: { pk: `${tenantId}/${messageId}` },
        TableName: process.env.MESSAGES_V3_TABLE,
      });

      if (!result?.Item) {
        return null;
      }

      return new Message(result.Item as IMessage);
    },

    setBilledUnits: async (messageId, billedUnits) => {
      try {
        // only allow the first operation on billed_units
        await updateItem({
          ConditionExpression:
            "attribute_exists(pk) AND attribute_not_exists(billed_units)",
          ExpressionAttributeNames: {
            "#billed_units": "billed_units",
          },
          ExpressionAttributeValues: {
            ":billed_units": billedUnits,
          },
          Key: {
            pk: `${tenantId}/${messageId}`,
          },
          TableName: process.env.MESSAGES_V3_TABLE,
          UpdateExpression: "SET #billed_units = :billed_units",
        });
      } catch (err) {
        if (err?.code === "ConditionalCheckFailedException") {
          return;
        }
        throw err;
      }
    },

    update: async (messageId, updateQuery) => {
      try {
        await updateItem({
          // as updateQuery is being spread over,
          // ensure attribute_exists(pk) is included
          // if ConditionExpression is being overriden
          ConditionExpression: "attribute_exists(pk)",
          Key: {
            pk: `${tenantId}/${messageId}`,
          },
          ReturnValues: "NONE",
          ...updateQuery,
          TableName: process.env.MESSAGES_V3_TABLE,
        });
      } catch (err) {
        if (err?.code === "ConditionalCheckFailedException") {
          throw new MessageNotFoundError();
        }
        throw err;
      }
    },

    listByRequestId: async (requestId, cursor) => {
      const queryFn = (
        currentShardId: number,
        currentLastEvaluatedKey: DocumentClient.Key,
        limit: number
      ) =>
        query({
          ...(currentLastEvaluatedKey && {
            ExclusiveStartKey: currentLastEvaluatedKey,
          }),
          ExpressionAttributeValues: {
            ":gsi1pk": `${requestId}/${currentShardId}`,
          },
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :gsi1pk",
          Limit: limit,
          TableName: process.env.MESSAGES_V3_TABLE,
        });

      return paginateAcrossShards<Message>(
        PAGE_SIZE,
        queryFn,
        PARTITION_SHARD_RANGE,
        cursor
      );
    },
  };
};
