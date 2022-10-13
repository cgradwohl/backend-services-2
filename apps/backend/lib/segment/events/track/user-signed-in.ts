import { defaultHandler } from "./index";

import { IAnalyticsEvent, IAnalyticsEventResponse } from "../../types";

// https://segment.com/docs/connections/spec/#signed-in
export default ({
  key,
  tenantId,
  userId,
}: IAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const extended = {
    properties: {
      username: base.userId,
    },
  };
  return { ...base, ...extended };
};
