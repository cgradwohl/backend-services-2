import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => {
  try {
    if (!profile.ms_teams) {
      return false;
    }

    if (typeof profile.ms_teams !== "object") {
      throw new Error("profile.ms_teams must be an object");
    }

    const { ms_teams: msTeams } = profile as any;
    // user_id | channel_id | conversation_id are required
    // service_url is required
    if (
      (!msTeams.user_id && !msTeams.channel_id && !msTeams.conversation_id) ||
      !msTeams.service_url
    ) {
      return false;
    }
    return true;
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default handles;
