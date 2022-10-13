import { getByProvider } from "~/lib/configurations-service";

// starting July 16 as cutoff
const MESSAGES_START = 1626456300956;

export const getFromTime = async (tenantId: string) => {
  let inAppFromDate: string;
  try {
    const courierProvider = await getByProvider(tenantId, "courier");
    const providerConfig = tenantId.includes("test")
      ? courierProvider?.json?.test
      : courierProvider?.json;

    inAppFromDate = providerConfig?.inAppFromDate as string;

    if (!inAppFromDate) {
      return MESSAGES_START;
    }

    const start = new Date(inAppFromDate).getTime();
    // do not go too much in the past
    return start > MESSAGES_START ? start : MESSAGES_START;
  } catch {
    return MESSAGES_START;
  }
};
