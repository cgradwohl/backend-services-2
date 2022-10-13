import { HandlesFn } from "../types";
import { getSlackBotProfile } from "./bot";
import { getSlackWebhookFromProfile } from "./webhook";
import { WebClient as Slack } from "@slack/web-api";

const handles: HandlesFn = async ({ profile, providerConfig }) => {
  const slackProfile = getSlackBotProfile(profile);
  const hasProfile = Boolean(
    slackProfile || getSlackWebhookFromProfile(profile)
  );

  if (!hasProfile) {
    return false;
  }

  if (!providerConfig?.slack?.presenceChecking) {
    return true;
  }

  if (!slackProfile.access_token || !slackProfile.user_id) {
    return false;
  }

  const client = new Slack(slackProfile.access_token);
  const isOnline = await client.users.getPresence({
    user: slackProfile.user_id,
  });

  if (isOnline?.presence === "active") {
    return true;
  }

  return "USER_IS_AWAY";
};

export default handles;
