import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  INotificationTestSentAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: INotificationTestSentAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const {
    brandId,
    draftId,
    messageId,
    notificationId,
    recipientId,
    templateId,
  } = body;

  const extended = {
    properties: {
      brandId,
      draftId,
      messageId,
      notificationId,
      recipientId,
      templateId,
    },
  };
  return { ...base, ...extended };
};
