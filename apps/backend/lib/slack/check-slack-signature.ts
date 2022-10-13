import crypto from "crypto";

import { Unauthorized } from "~/lib/http-errors";
import generateSlackSignature from "./generate-slack-signature";

const checkSlackSignature = (
  signingSecret: string,
  body: string,
  signature: string,
  timestamp: string
) => {
  const computedSignature = generateSlackSignature(
    signingSecret,
    timestamp,
    body
  );

  if (
    computedSignature.length !== signature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    )
  ) {
    throw new Unauthorized("Invalid signature");
  }
};

export default checkSlackSignature;
