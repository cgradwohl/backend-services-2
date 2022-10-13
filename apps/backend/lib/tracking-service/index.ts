import chunkArray from "~/lib/chunk-array";
import { batchWrite, getItem } from "~/lib/dynamo";
import { ITrackingRecord } from "~/types.internal";
import getEnvVar from "../get-environment-variable";

const CLICK_THROUGH_TRACKING_TABLE_NAME = getEnvVar(
  "CLICK_THROUGH_TRACKING_TABLE_NAME"
);

const EVENT_TRACKING_RECORDS_TABLE = getEnvVar("EVENT_TRACKING_RECORDS_TABLE");

const getEventTrackingRecordDynamoKey = (
  tenantId: string,
  trackingId: string
) => {
  return {
    pk: `${tenantId}/${trackingId}`,
  };
};

export const getTrackingRecord = async (
  tenantId: string,
  trackingId: string
): Promise<ITrackingRecord | undefined> => {
  if (!trackingId) {
    return;
  }

  // look up v2
  const { Item: record } = await getItem({
    Key: getEventTrackingRecordDynamoKey(tenantId, trackingId),
    TableName: EVENT_TRACKING_RECORDS_TABLE,
  });

  // fallback to v1
  if (!record) {
    const { Item } = await getItem({
      Key: {
        tenantId,
        trackingId,
      },
      TableName: CLICK_THROUGH_TRACKING_TABLE_NAME,
    });

    return Item as ITrackingRecord;
  }

  // return v2 record
  return record as ITrackingRecord;
};

export const saveTrackingRecords = async (records: ITrackingRecord[]) => {
  if (records.length === 0) {
    return;
  }

  // batch writes can only do up to 25 items at a time
  const v2Batches = chunkArray(records, 25);

  return Promise.all(
    v2Batches.map(async (v2Batch) => {
      await batchWrite({
        RequestItems: {
          [EVENT_TRACKING_RECORDS_TABLE]: v2Batch.map(
            (Item: ITrackingRecord) => ({
              PutRequest: {
                Item: {
                  ...getEventTrackingRecordDynamoKey(
                    Item.tenantId,
                    Item.trackingId
                  ),
                  ...Item,
                  created: Date.now(),
                },
              },
            })
          ),
        },
      });
    })
  );
};
