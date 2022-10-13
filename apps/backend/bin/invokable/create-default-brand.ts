import { createDefaultBrand, get as getBrand } from "~/lib/brands";
import { IBrand } from "~/lib/brands/types";
import { NotFound } from "~/lib/http-errors";
import log from "~/lib/log";
import { get as getTenant } from "~/lib/tenant-service";

export default async (event: any) => {
  const tenantId = event.tenantId;

  if (!tenantId) {
    throw new Error("tenantId is a required property on the event");
  }

  log(`Fetching tenant ${tenantId}`);
  const tenant = await getTenant(tenantId);

  if (tenant.defaultBrandId) {
    let existing: IBrand;
    // actually fetch the brand and ensure no orphaned data
    try {
      // the object service throws if the item in question is not found
      existing = await getBrand(tenantId, tenant.defaultBrandId);
    } catch (err) {
      if (!(err instanceof NotFound)) {
        throw err;
      }
    }

    if (existing) {
      // if data found, log and exit the process
      log(`Tenant ${tenantId} already has a default brand`);
      return;
    }
  }

  await createDefaultBrand(tenantId, tenant.creator);
  log(`Default brand created for ${tenantId}`);
};
