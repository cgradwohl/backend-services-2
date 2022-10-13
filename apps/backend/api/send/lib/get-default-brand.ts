import { getDefault, getDefaultBrandId } from "~/lib/brands";
import logger from "~/lib/logger";
import { IBrand } from "~/types.api";
import getBrand from "./get-brand";

type GetDefaultBrand = (
  tenantId: string,
  useMaterializedBrands: boolean
) => Promise<IBrand>;

const getDefaultBrand: GetDefaultBrand = async (
  tenantId: string,
  useMaterializedBrands: boolean
) => {
  if (!useMaterializedBrands) {
    logger.debug(
      `Materialized store lookup disabled for tenantId ${tenantId}, fallback to getDefault`
    );
    return getDefault(tenantId);
  }

  const defaultBrandId: string = await getDefaultBrandId(tenantId);

  if (!defaultBrandId) {
    return null;
  }

  const defaultBrand = await getBrand(
    tenantId,
    defaultBrandId,
    useMaterializedBrands
  );
  return defaultBrand;
};

export default getDefaultBrand;
