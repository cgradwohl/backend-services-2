import launchdarkly from "~/lib/launchdarkly";
import logger from "~/lib/logger";

type Flag = "event-bridge-delivery-pipeline";

export const useLaunchDarkly = async (flagName: Flag, tenantId: string) => {
  const ready = launchdarkly.waitForInitialization();

  try {
    await ready;
  } catch (err) {
    logger.error("LaunchDarkly: Error initializing", err);
    return false;
  }

  try {
    const variation = await launchdarkly.variation(
      flagName,
      {
        anonymous: true,
        custom: {
          tenantId,
        },
        key: flagName,
      },
      false
    );
    return variation === true;
  } catch (err) {
    logger.error("LaunchDarkly: Error checking variation", err);
    return false;
  }
};
