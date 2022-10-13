import { convertBrandId, get, getDefaultBrandId } from "~/lib/brands";
import applyDefaultBrand from "~/lib/brands/apply-default";
import fromCourierObject from "~/lib/brands/from-courier-object";
import { BrandCourierObject, IGetFnOptions } from "~/lib/brands/types";
import logger from "~/lib/logger";
import materializedObjectService from "~/objects/services/materialized-objects";
import { IBrand } from "~/types.api";
import getDefaultBrand from "./get-default-brand";

type GetBrand = (
  tenantId: string,
  brandId: string,
  useMaterializedBrands: boolean,
  options?: IGetFnOptions
) => Promise<IBrand>;

const getBrand: GetBrand = async (
  tenantId: string,
  brandId: string,
  useMaterializedBrands: boolean,
  options?: IGetFnOptions
) => {
  if (!useMaterializedBrands) {
    logger.debug(
      `Materialized store lookup disabled for tenantId ${tenantId}, fallback to get`
    );
    return get(tenantId, brandId, options);
  }

  const materializedObjects = materializedObjectService(tenantId);

  const id = convertBrandId(brandId);
  const item = await materializedObjects.get(id);
  if (!item) {
    logger.debug(
      `tenantId/id ${tenantId}/${id} not found in materialized store, fallback to get`
    );
    return get(tenantId, brandId, options);
  }

  const brand = fromCourierObject(item as BrandCourierObject);

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  const isDefaultBrand = defaultBrandId === brand.id.split("/")[0];

  if (options && options.extendDefaultBrand) {
    const defaultBrand = await getDefaultBrand(tenantId, useMaterializedBrands);
    return {
      ...applyDefaultBrand(brand, defaultBrand),
      isDefaultBrand,
    };
  }

  return {
    ...brand,
    isDefaultBrand,
  };
};

export default getBrand;
