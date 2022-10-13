import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IAccountRemovedUserAnalyticsEvent,
} from "../../types";

// https://segment.com/docs/connections/spec/b2b-saas/#account-removed-user
export default ({
  body,
  key,
  tenantId,
  userId,
}: IAccountRemovedUserAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { removedUserId } = body;
  const extended = {
    properties: {
      removed_user_id: removedUserId,
    },
  };
  return { ...base, ...extended };
};
