import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => {
  try {
    if (!profile.discord) {
      return false;
    }

    if (typeof profile.discord !== "object") {
      throw new Error("profile.discord must be an object");
    }

    const { discord } = profile as any;

    return discord.channel_id !== "" || discord.user_id !== "";
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default handles;
