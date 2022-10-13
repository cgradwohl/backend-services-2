import log from "~/lib/log";
import {
  buildTenantMetricOperation,
  trackTenantMetrics,
} from "~/lib/tenant-metrics";
import strategies from "./strategies";

export default async (event: any) => {
  const { tenantId } = event;

  if (!tenantId) {
    throw new Error("tenantId is a required property on the event");
  }

  const metrics = await strategies.collect(tenantId);
  if (metrics) {
    log("metrics", metrics);

    const keys = Object.keys(metrics);
    const operations = keys.map((key) =>
      buildTenantMetricOperation(key, "SET", metrics[key])
    );

    await trackTenantMetrics(operations, tenantId);

    log(`tenant metrics updated for ${tenantId}:, ${JSON.stringify(metrics)}`);
  } else {
    log(`no tenant metrics to update for ${tenantId}`);
  }
};
