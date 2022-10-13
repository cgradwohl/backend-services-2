import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IIntegrationAddedAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: IIntegrationAddedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { created, creator, json, title } = body;
  const provider = json.provider;
  const extended = {
    properties: {
      created,
      creator,
      provider,
      title,
    },
  };
  return { ...base, ...extended };
};
