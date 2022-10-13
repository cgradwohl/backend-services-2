import crypto from "crypto";
import makeError from "make-error";

const SSO_COMMUNITY_SECRET = process.env.SSO_COMMUNITY_SECRET;

const MissingSsoCommunitySecretError = makeError(
  "Invalid environment variable: SSO_COMMUNITY_SECRET"
);

export default (sso: string) => {
  if (!SSO_COMMUNITY_SECRET) {
    throw new MissingSsoCommunitySecretError();
  }
  const hmac = crypto.createHmac("sha256", SSO_COMMUNITY_SECRET);
  hmac.update(sso);
  return hmac.digest("hex");
};
