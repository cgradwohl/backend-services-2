import crypto from "crypto";
import { Unauthorized } from "../http-errors";
import { getWorkOsWebhookSecret } from "./utils";

/**
 * Throws an Unauthorized error if the signature is invalid
 *
 * @returns timestamp if signature is valid.
 */
export function verifyWorkOsWebhookSignature(
  signature: string,
  reqBody: any
): number {
  const [t, v1] = signature.split(",");
  const issuedTimestamp = Number(t.split("=")[1]);
  const signatureHash = v1.split("=")[1];
  const MAX_SECONDS_SINCE_ISSUED = 2 * 60;
  const secondsSinceIssued = (Date.now() - Number(issuedTimestamp)) / 1000;
  if (secondsSinceIssued > MAX_SECONDS_SINCE_ISSUED) {
    throw new Unauthorized("Signature expired");
  }

  const signedPayload = `${issuedTimestamp}.${JSON.stringify(reqBody)}`;

  const expectedSignature = crypto
    .createHmac("sha256", getWorkOsWebhookSecret())
    .update(signedPayload)
    .digest()
    .toString("hex");

  if (signatureHash !== expectedSignature) {
    throw new Unauthorized("Signature rejected");
  }

  return issuedTimestamp;
}
