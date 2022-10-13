import { getDefaultBrandId, getLatestDefault } from "~/lib/brands";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import { IBrand } from "~/types.api";
import getLatestBrand from "./get-latest-brand";

type GetLatestDefaultBrand = (tenantId: string) => Promise<IBrand>;

const getLatestDefaultBrand: GetLatestDefaultBrand = async (
  tenantId: string
) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return getLatestDefault(tenantId);
  }

  return getLatestBrand(tenantId, await getDefaultBrandId(tenantId));
};

export default getLatestDefaultBrand;
