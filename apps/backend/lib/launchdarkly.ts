import LaunchDarkly from "launchdarkly-node-server-sdk";
import { CourierLogger } from "~/lib/logger";

const LAUNCHDARKLY_SDK_KEY = process.env.LAUNCHDARKLY_SDK_KEY;
const offline = !LAUNCHDARKLY_SDK_KEY;
const { logger } = new CourierLogger("LaunchDarkly");

if (offline) {
  logger.warn("LAUNCHDARKLY_SDK_KEY not detected: Offline mode enabled");
}

const options: LaunchDarkly.LDOptions = {
  logger,
  offline,
};
const client = LaunchDarkly.init(LAUNCHDARKLY_SDK_KEY, options);
export default client;
