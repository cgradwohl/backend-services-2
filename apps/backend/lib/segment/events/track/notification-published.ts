import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  INotificationPublishedAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: INotificationPublishedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { id, message, published, title } = body;
  const extended = {
    properties: {
      id,
      publishMessage: message,
      published,
      publisher: userId,
      title,
    },
  };
  return { ...base, ...extended };
};
