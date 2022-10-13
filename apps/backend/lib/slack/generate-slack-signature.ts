import crypto from "crypto";

const generateSlackSignature = (
  signingSecret: string,
  timestamp: string,
  body: string
) => {
  return `v0=${crypto
    .createHmac("sha256", signingSecret)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex")}`;
};

export default generateSlackSignature;
