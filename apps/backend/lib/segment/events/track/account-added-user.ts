import { defaultHandler } from "./index";

import {
  IAccountAddedUserAnalyticsEvent,
  IAnalyticsEventResponse,
} from "../../types";

// https://segment.com/docs/connections/spec/#account-added-user
export default ({
  body,
  key,
  tenantId,
  userId,
}: IAccountAddedUserAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { addedUserId } = body;
  const extended = {
    properties: {
      added_user_id: addedUserId,
      role: "User",
    },
  };
  return { ...base, ...extended };
};
