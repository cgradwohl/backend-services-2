import { instrumentStopwatchMetric } from "~/lib/courier-emf/logger-metrics-utils";
import { CourierLogger } from "~/lib/logger";
import { validateV2CustomTierRequests } from "./validate-v2-custom-tier-requests";
import { validateV2RequestAjv } from "./validate-v2-request-ajv";
import { validateV2RequestHardcoded } from "./validate-v2-request-hardcoded";

export async function validateV2Request(request: any, tenantId: string) {
  const { logger } = new CourierLogger("handleV2Request");

  await Promise.all([
    instrumentStopwatchMetric("validateRequestWithAjv", async () => {
      validateV2RequestAjv(request);
    }).catch((e) => logger.warn(e)), // eat the error but log it
    instrumentStopwatchMetric("validateRequestWithLegacy", async () => {
      await validateV2RequestHardcoded(request, tenantId);
    }),
    validateV2CustomTierRequests(request, tenantId),
  ]);
}
