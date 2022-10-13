import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IUserSignedUpAnalyticsEvent,
} from "../../types";

// https://segment.com/docs/connections/spec/b2b-saas/#signed-up
export default ({
  body,
  key,
  tenantId,
  userId,
}: IUserSignedUpAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { email } = body;
  const extended = {
    properties: {
      username: base.userId,
      email,
    },
  };
  return { ...base, ...extended };
};
