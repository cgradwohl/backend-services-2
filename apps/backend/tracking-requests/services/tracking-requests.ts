import jsonStore from "../stores/json";
import { NewTrackingRequest } from "../types";
import { TenantRouting, TenantScope } from "~/types.internal";

const getObjectKey = (tenantId: string, trackingId: string) =>
  `${tenantId}/${trackingId}.json`;

export default (
  tenantId: string,
  scope: TenantScope,
  dryRunKey?: TenantRouting
) => {
  return {
    create: async (trackingId: string, request: NewTrackingRequest) => {
      const key = getObjectKey(tenantId, trackingId);

      await jsonStore.put(key, {
        ...request,
        created: new Date().toISOString(),
        dryRunKey,
        scope,
        tenantId,
        trackingId,
      });
    },

    get: async (trackingId: string) => {
      const key = getObjectKey(tenantId, trackingId);
      return jsonStore.get(key);
    },
  };
};
