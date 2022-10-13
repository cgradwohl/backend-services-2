import { Sequence } from "~/api/send/types";
import { PaymentRequired } from "~/lib/http-errors";
import logger from "~/lib/logger";
import { isCustomTierTenantId } from "~/lib/plan-pricing";

/**
 * Checks a request for custom (business) subscription tier features. If any are found, we ensure that the
 * tenant is a business tier account. If they are not, we throw a PaymentRequired http
 * error.
 *
 * Note: To keep things performant, we are running this in parallel with request validation.
 * This means we can not rely on the request structure being correct.
 */
export async function validateV2CustomTierRequests(
  request: unknown,
  tenantId: string
): Promise<void> {
  // Leave request model validation to the request validators
  if (typeof request !== "object") return;

  const { message, sequence } = (request as any) ?? {};

  const hasCustomTierFeature =
    sequenceHasCustomTierFeature(sequence) ||
    messageHasCustomTierFeature(message);

  if (!hasCustomTierFeature) return;

  const isCustomTierTenant = await isCustomTierTenantId(tenantId).catch(() => {
    logger.warn(
      "Failed fetching tenant while checking for custom tier features"
    );
    // Default to true to prevent an error from punishing paid tenants
    return true;
  });

  if (isCustomTierTenant) return;

  throw new PaymentRequired(
    "Request has features that require a business tier subscription"
  );
}

function sequenceHasCustomTierFeature(sequence: unknown): boolean {
  if (!(sequence instanceof Array)) return false;
  return (sequence as Sequence).some((seq) =>
    messageHasCustomTierFeature(seq.message)
  );
}

function messageHasCustomTierFeature(message?: any): boolean {
  if (typeof message !== "object") return false;

  // For now the only business tier feature is provider and record level timeouts
  return (
    hasKey(message.timeout, "channel") ||
    hasKey(message.timeout, "provider") ||
    someRecordHasKey(message.providers, "timeout") ||
    someRecordHasKey(message.channels, "timeout")
  );
}

function someRecordHasKey(record: unknown, key: string): boolean {
  if (typeof record !== "object") return false;
  return Object.values(record).some((record) => hasKey(record, key));
}

function hasKey(object: unknown, key: string): boolean {
  return typeof object === "object" ? object.hasOwnProperty(key) : false;
}
