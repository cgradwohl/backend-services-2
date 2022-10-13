import axios from "axios";

import { warn } from "~/lib/log";

export default async (externalId: string) => {
  const COMMUNITY_USER_API_URI = `https://community.courier.com/u/by-external/${externalId}.json`;
  try {
    const { data } = await axios.get(COMMUNITY_USER_API_URI);
    return !(data && data.user && data.user.id);
  } catch (e) {
    // if user is not found, require email activation from discourse
    // or sso will fail with a misleading "bad signature" error
    if (e.response.status === 404) {
      warn("Unable to find Community user with external id:", externalId);
      return true;
    }
    throw new Error(e);
  }
};
