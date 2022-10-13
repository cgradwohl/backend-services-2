import { createDefaultBrand } from "~/lib/brands";
import log, { error } from "~/lib/log";
import {
  update as updateSettings,
  get as getSettings,
} from "~/lib/settings-service";
import { get as getTenant } from "~/lib/tenant-service";
import { NotFound } from "~/lib/http-errors";

export default async (event: any) => {
  const tenantId = event.tenantId;

  if (!tenantId) {
    throw new Error("tenantId is a required property on the event");
  }

  log(`Fetching tenant ${tenantId}`);
  const tenant = await getTenant(tenantId);

  try {
    await getSettings({
      id: "defaultBrandId",
      tenantId,
    });

    log(
      `Tenant ${tenantId} already has defaultBrandId env settings.  skipping.`
    );
  } catch (ex) {
    log("no brandId in env settings, migrate from tenant");
    if (ex instanceof NotFound) {
      await updateSettings<string>(
        {
          id: "defaultBrandId",
          tenantId,
        },
        tenant.defaultBrandId
      );
    } else {
      error("ERROR", ex);
      throw ex;
    }
  }

  try {
    await getSettings({
      id: "defaultBrandId",
      tenantId: `${tenantId}/test`,
    });

    log("test env already has defaultBrandId, skipping");
  } catch (ex) {
    if (ex instanceof NotFound) {
      await createDefaultBrand(`${tenantId}/test`, `tenant/${tenant.creator}`);
      log("created defaultBrand for test env");
    } else {
      error("ERROR", ex);
      throw ex;
    }
  }
};
