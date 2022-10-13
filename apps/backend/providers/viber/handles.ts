import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ config, profile }) => {
  if (!config.json.token) return false;
  if (!config.json.name) return false;
  if (!profile.viber) return false;

  if (typeof profile.viber !== "object") {
    throw new ProviderResponseError("profile.viber must be an object");
  }

  const viber: { [key: string]: any } = profile.viber;
  if (!viber.receiver) return false;
  return true;
};

export default handles;
