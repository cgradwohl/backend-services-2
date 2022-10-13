import { getDefault, getDefaultBrandId } from "~/lib/brands";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import { IBrand } from "~/types.api";
import getBrand from "./get-brand";

type GetDefaultBrand = (tenantId: string) => Promise<IBrand>;

const getDefaultBrand: GetDefaultBrand = async (tenantId: string) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return getDefault(tenantId);
  }

  const defaultBrandId: string = await getDefaultBrandId(tenantId);

  if (!defaultBrandId) {
    return null;
  }

  const defaultBrand = await getBrand(tenantId, defaultBrandId);
  return defaultBrand;
};

export default getDefaultBrand;
