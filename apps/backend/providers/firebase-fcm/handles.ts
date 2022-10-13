import { providerHasStoredTokens } from "~/lib/token-storage";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile, tokensByProvider }) =>
  !!profile.firebaseToken ||
  providerHasStoredTokens("firebase-fcm", tokensByProvider);

export default handles;
