import { deleteItem, put, query } from "~/lib/dynamo";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import { IOverflowMessageItem, OverflowMessage } from "../types";

export default (tenantId: string) => {
  return {
    delete: async (item: IOverflowMessageItem) => {
      await deleteItem({
        Key: OverflowMessage.getKey(item),
        TableName: process.env.MESSAGES_OVERFLOW_TABLE,
      });
    },

    isOverflowTenant: (eventId: string) => {
      const TARGET_TENANT_ID = "d620cc0a-1161-4d3d-803a-ec3c729801c3"; // Beacons
      const TARGET_NOTIFICATIONS = ["3JSJS6QN2QM0F0PET5HJZH7WMAAM"]; // Beacons "Weekly Update to Creator"

      const STAGING_TENANT = "3ac646a5-6dda-4f43-9f3f-1dd27a2ecd38";
      const PRODUCTION_TENANT = "0cd4b9fa-4d32-4843-92e0-c064e1d40c57";
      const TESTING_TENANT = "i-am-test-overflow-enabled-tenant";

      const OVERFLOW_TENANTS = [
        STAGING_TENANT,
        PRODUCTION_TENANT,
        TESTING_TENANT,
      ];

      if (
        tenantId === TARGET_TENANT_ID &&
        TARGET_NOTIFICATIONS.includes(eventId)
      ) {
        return true;
      }

      return (
        // process.env.OVERFLOW_TENANT_ID is only valid in dev (it is read from .dev-config)
        process.env.OVERFLOW_TENANT_ID === tenantId ||
        OVERFLOW_TENANTS.includes(tenantId)
      );
    },

    list: async () => {
      // BATCH_SIZE - amount of total records we process per minute
      // PARTITION_SHARD_RANGE - the range of partition shards
      // LIMIT_PER_SHARD - amount of records we query per shard
      const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "4000", 10);
      const PARTITION_SHARD_RANGE = parseInt(
        process.env.PARTITION_SHARD_RANGE,
        10
      );
      const LIMIT_PER_SHARD = Math.floor(BATCH_SIZE / PARTITION_SHARD_RANGE);

      if (LIMIT_PER_SHARD < 1) {
        throw new Error(
          "Invalid Limit Per Shard. The Limit must be at least 1."
        );
      }

      const range = [...Array(PARTITION_SHARD_RANGE)].map((_, i) => i + 1);
      // get oldest messages in each partition
      const results = await Promise.all(
        range.map((shard) => {
          return query({
            ExpressionAttributeNames: {
              "#pk": "pk",
            },
            ExpressionAttributeValues: {
              ":pk": `${tenantId}/${shard}`,
            },
            KeyConditionExpression: "#pk = :pk",
            Limit: LIMIT_PER_SHARD,
            TableName: process.env.MESSAGES_OVERFLOW_TABLE,
          });
        })
      );

      return results.flatMap(({ Items }) => Items as IOverflowMessageItem[]);
    },

    create: async (message: OverflowMessage) => {
      const shard = getHashFromRange(
        parseInt(process.env.PARTITION_SHARD_RANGE, 10)
      );

      await put({
        Item: message.toItem(shard),
        TableName: process.env.MESSAGES_OVERFLOW_TABLE,
      });
    },
  };
};
