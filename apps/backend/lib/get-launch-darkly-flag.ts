import launchdarkly from "~/lib/launchdarkly";
import { CourierLogger } from "~/lib/logger";

const { logger } = new CourierLogger("FeatureFlags");

export const getFeatureTenantVariation = async (
  flagName: string,
  tenantId: string
): Promise<boolean> => {
  try {
    await launchdarkly.waitForInitialization();
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
    logger.error("Error initializing", err);
    return false;
  }
};

export const getFeatureTenantTemplateVariation = async <T>(
  flagName: string,
  tenantId: string,
  defaultValue: T
): Promise<T> => {
  try {
    await launchdarkly.waitForInitialization();
    const variation = await launchdarkly.variation(
      flagName,
      {
        anonymous: true,
        custom: {
          tenantId,
        },
        key: flagName,
      },
      defaultValue
    );
    return variation as T;
  } catch (err) {
    logger.error("Error initializing", err);
    return defaultValue;
  }
};

// This function is used to track custom events for Launch Darkly experiments
export const trackEvent = async (
  eventName: string,
  userId: string,
  tenantId: string
): Promise<void> => {
  try {
    await launchdarkly.waitForInitialization();
    launchdarkly.track(
      eventName,
      {
        key: userId,
      },
      { tenantId }
    );
    launchdarkly.flush();
  } catch (err) {
    logger.error("Error initializing", err);
  }
};

// Do not use outside of onboarding.
// For now we want to user experience consistent for all users within a workspace.
// Scope feature flagging by tenantId
export const getFeatureUserVariation = async (
  flagName: string,
  userId: string
): Promise<boolean> => {
  try {
    await launchdarkly.waitForInitialization();
    const variation = await launchdarkly.variation(
      flagName,
      {
        key: userId,
      },
      false
    );
    return variation === true;
  } catch (err) {
    logger.error("Error initializing", err);
    return false;
  }
};
