import { GetDeliveredTimestamp } from "../types";

// Grabbing the TS stored by Slack. Their way of storing TS described here:
// https://github.com/slackhq/slack-api-docs/issues/7#issuecomment-67913241
const getDeliveredTimestamp: GetDeliveredTimestamp = (providerResponse) => {
  const response =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;
  const ts = parseFloat(response?.ts);

  return isNaN(ts) ? undefined : Math.round(ts * 1000);
};

export default getDeliveredTimestamp;
