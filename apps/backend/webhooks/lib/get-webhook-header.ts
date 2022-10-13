// https://stripe.com/docs/webhooks/signatures

import crypto from "crypto";
import { InternalCourierError } from "~/lib/errors";
import logger from "~/lib/logger";

// https://github.com/stripe/stripe-node/blob/master/lib/Webhooks.js
export const computeSignature = (payload, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
};

export const getWebhookHeader = (params: { body: string; secret: string }) => {
  try {
    if (!params?.secret) {
      return undefined;
    }

    const headers = {};
    const timestamp = Date.now();
    const payload = `${timestamp}.${params?.body}`;
    const signature = computeSignature(payload, params?.secret);

    headers["courier-signature"] = `t=${timestamp},signature=${signature}`;
    return headers;
  } catch (error) {
    logger.error("::: Get Webhook Header Error :::");

    throw new InternalCourierError(error);
  }
};
