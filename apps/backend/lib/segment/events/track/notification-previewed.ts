import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  INotificationPreviewedAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: INotificationPreviewedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { brandId, draftId, messageId, provider, templateId } = body;

  const extended = {
    properties: {
      brandId,
      draftId,
      messageId,
      provider,
      templateId,
    },
  };
  return { ...base, ...extended };
};
