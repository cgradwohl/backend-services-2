import store from "~/tracking-requests/stores/json";
import { NewTrackingRequest } from "../types";
import { TenantRouting, TenantScope } from "~/types.internal";
import { nanoid } from "nanoid";
import getEnvVar from "~/lib/get-environment-variable";
import { putRecord } from "~/lib/kinesis";

const getObjectKey = (tenantId: string, trackingId: string) =>
  `${tenantId}/${trackingId}.json`;

export default (
  tenantId: string,
  scope: TenantScope,
  dryRunKey?: TenantRouting
) => {
  return {
    create: async (
      trackingId: string,
      request: NewTrackingRequest,
      shouldUseInboundSegmentEventsKinesis: boolean
    ) => {
      const key = getObjectKey(tenantId, trackingId);
      const json = {
        ...request,
        created: new Date().toISOString(),
        dryRunKey,
        scope,
        tenantId,
        trackingId,
      };

      if (!shouldUseInboundSegmentEventsKinesis) {
        await store.trackingRequest.put(key, json);
      } else {
        await store.inboundSegmentEvents.put(key, json);
        await putRecord({
          Data: {
            scope,
            tenantId,
            trackingId,
            shouldUseInboundSegmentEventsKinesis,
          },
          PartitionKey: nanoid(),
          StreamName: getEnvVar("INBOUND_SEGMENT_EVENTS_KINESIS_STREAM"),
        });
      }
    },

    get: async (
      trackingId: string,
      shouldUseInboundSegmentEventsKinesis: boolean
    ) => {
      const key = getObjectKey(tenantId, trackingId);
      if (shouldUseInboundSegmentEventsKinesis) {
        return store.inboundSegmentEvents.get(key);
      }
      return store.trackingRequest.get(key);
    },
  };
};
