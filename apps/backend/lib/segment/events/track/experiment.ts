import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IExperimentAnalyticsEvent,
} from "../../types";

export default ({
  body,
  key,
  tenantId,
  userId,
}: IExperimentAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { experiment, variation } = body;
  const extended = {
    properties: { experiment, variation },
  };
  return { ...base, ...extended };
};
