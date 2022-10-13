import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  ITenantOwnershipTransferredAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: ITenantOwnershipTransferredAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { ownerId } = body;
  const extended = {
    properties: {
      new_owner_id: ownerId,
      old_owner_id: userId,
    },
  };
  return { ...base, ...extended };
};
