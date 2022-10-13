import { acceptableFeatureNames } from "~/bin/invokable/feature-flag-from-send-handler";
import { getItem } from "~/lib/dynamo";
import logger from "~/lib/logger";

// use this type to extend the flags
export type FlagName = typeof acceptableFeatureNames[number];
/*
 * API specific features flags.
 * Reason this exists is because we want to be able to turn on/off features without relying on Launch Darkly
 * this is also only going to be ONLY used in SEND handler where we do not want to use the LaunchDarkly client
 */
export default function apiFeatureService(workspaceId: string) {
  return {
    async variation<T>(flagName: FlagName, defaultValue: T): Promise<T> {
      try {
        const response = await getItem({
          Key: {
            pk: `${workspaceId}/${flagName}`,
          },
          TableName: process.env.FEATURE_TOGGLE_TABLE,
        });
        // if we want, we can pass the whole item document back to the handler function to determine the the flag value
        return (response?.Item?.variation as T) ?? defaultValue;
      } catch (error) {
        logger.error(
          `Error getting API Feature flag ${flagName}, ${error.toString()}`
        );
        return defaultValue;
      }
    },
  };
}
