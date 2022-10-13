import { providerHasStoredTokens } from "~/lib/token-storage";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile, tokensByProvider }) =>
  Boolean(profile.oneSignalExternalId) ||
  Boolean(profile.oneSignalPlayerID) ||
  providerHasStoredTokens("onesignal", tokensByProvider); // profile.oneSignalPlayerID is now optional as tokens may be stored in the token storage API

export default handles;
