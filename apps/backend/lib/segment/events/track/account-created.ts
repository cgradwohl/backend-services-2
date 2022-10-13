import { defaultHandler } from "./index";

import {
  IAccountCreatedAnalyticsEvent,
  IAnalyticsEventResponse,
} from "../../types";

// https://segment.com/docs/connections/spec/b2b-saas/#account-created
export default ({
  body,
  key,
  tenantId,
  userId,
}: IAccountCreatedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { tenantName } = body;
  const extended = {
    properties: {
      account_name: tenantName,
    },
  };
  return { ...base, ...extended };
};
