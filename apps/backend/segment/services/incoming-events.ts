import differenceInMinutes from "date-fns/differenceInMinutes";
import { createMd5Hash } from "~/lib/crypto-helpers";
import { getItem, put, query } from "~/lib/dynamo";
import generateS3Prefix from "~/lib/generate-s3-prefix";
import getEnvVar from "~/lib/get-environment-variable";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import isNil from "~/lib/is-nil";
import { currentTimeMs } from "~/lib/utils";
import segmentEventHistoryStore from "~/segment/stores/segment-event-history-store";
import {
  IInboundSegmentGroupRequest,
  IInboundSegmentIdentifyRequest,
  IInboundSegmentTrackRequest,
  InboundSegmentRequestTypesEnum,
} from "../types";

export type SegmentEvent =
  | IInboundSegmentTrackRequest
  | IInboundSegmentGroupRequest
  | IInboundSegmentIdentifyRequest;

export interface ISegmentEventItem {
  pk: string;
  gsi1pk: string;
  gsi1sk: string;
  lastUpdated?: string;
  segmentEvent?: SegmentEvent;
}

interface IIncomingSegmentEventService {
  put: (segmentEvent: SegmentEvent) => Promise<void>;
  get: (eventId: string) => Promise<ISegmentEventItem>;
  list: () => Promise<ISegmentEventItem[]>;
  shouldKeepHistory: (segmentEvent: SegmentEvent) => Promise<boolean>;
}

/** Delay in minutes between capturing events. Currently, configured to capture one example event every 24 hours */
const DELAY_BETWEEN_EVENT_CAPTURE_IN_MINUTES = 24 * 60;

// PARTITION_SHARD_RANGE - the range of partition shards
const PARTITION_SHARD_RANGE = parseInt(
  process.env.PARTITION_SHARD_RANGE ?? "10",
  10
);

const extractEventId = (segmentEvent) => {
  return segmentEvent.type === InboundSegmentRequestTypesEnum.TRACK
    ? `${segmentEvent.type}/${segmentEvent.event}`
    : `${segmentEvent.type}`;
};

export default (tenantId: string): IIncomingSegmentEventService => {
  const get: IIncomingSegmentEventService["get"] = async (eventId) => {
    const result = await getItem({
      Key: { pk: `${tenantId}/${eventId}` },
      TableName: getEnvVar("SEGMENT_EVENTS_TABLE"),
    });

    return result?.Item as ISegmentEventItem;
  };

  return {
    put: async (segmentEvent) => {
      const shard = getHashFromRange(PARTITION_SHARD_RANGE);
      const prefix = generateS3Prefix();
      const eventId = extractEventId(segmentEvent);
      const hash = createMd5Hash(eventId);
      const filePath = `${prefix}/${hash}.json`;
      const timestamp = new Date().toISOString();

      await segmentEventHistoryStore.put(filePath, segmentEvent);

      await put({
        Item: {
          pk: `${tenantId}/${eventId}`,
          gsi1pk: `${tenantId}/${shard}`,
          gsi1sk: timestamp,
          lastUpdated: timestamp,
          s3Pointer: filePath,
        },
        TableName: getEnvVar("SEGMENT_EVENTS_TABLE"),
      });
    },

    get,

    list: async () => {
      const range = [...Array(PARTITION_SHARD_RANGE)].map((_, i) => i + 1);

      const results = await Promise.all(
        range.map(async (shard) => {
          const dynamoObj = await query({
            ExpressionAttributeNames: {
              "#gsi1pk": "gsi1pk",
            },
            ExpressionAttributeValues: {
              ":gsi1pk": `${tenantId}/${shard}`,
            },
            IndexName: "gsi1",
            KeyConditionExpression: "#gsi1pk = :gsi1pk",
            TableName: getEnvVar("SEGMENT_EVENTS_TABLE"),
          });

          const dynamoItemsMergedWithSegmentEventsFromS3 = await Promise.all(
            dynamoObj.Items.map(async (dynamoItem) => {
              const s3Obj = dynamoItem.s3Pointer
                ? await segmentEventHistoryStore.get(dynamoItem.s3Pointer)
                : {};
              return { ...dynamoItem, segmentEvent: s3Obj };
            })
          );
          dynamoObj.Items = dynamoItemsMergedWithSegmentEventsFromS3;
          return dynamoObj;
        })
      );

      return results.flatMap(({ Items }) => Items as ISegmentEventItem[]);
    },

    shouldKeepHistory: async (segmentEvent) => {
      const eventId = extractEventId(segmentEvent);
      const event = await get(eventId);

      if (isNil(event?.lastUpdated)) {
        return true;
      }

      const now = currentTimeMs();
      const lastUpdated = new Date(event.lastUpdated);

      const minSinceLastUpdated = differenceInMinutes(now, lastUpdated);
      if (minSinceLastUpdated > DELAY_BETWEEN_EVENT_CAPTURE_IN_MINUTES) {
        return true;
      }

      return false;
    },
  };
};
