import validLink from "~/lib/valid-link";

import { HandlesFn } from "../types";

const handles: HandlesFn = ({ config, profile }) => {
  const webhookConfig = config.json as any;
  if (!webhookConfig?.getConfigFromProfile) {
    return true;
  }

  const webhookUrl = (profile as any)?.webhook?.url;

  return Boolean(
    webhookUrl && typeof webhookUrl === "string" && validLink(webhookUrl)
  );
};

export default handles;
