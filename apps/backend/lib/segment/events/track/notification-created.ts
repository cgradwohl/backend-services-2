import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  INotificationCreatedAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: INotificationCreatedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { created, creator, id, title } = body;
  const extended = {
    properties: {
      created,
      creator,
      id,
      title,
    },
  };
  return { ...base, ...extended };
};
