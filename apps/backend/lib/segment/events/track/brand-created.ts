import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IBrandCreatedAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: IBrandCreatedAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { brand } = body;
  const extended = {
    properties: brand,
  };
  return { ...base, ...extended };
};
