import { convertBrandId, get, getDefaultBrandId } from "~/lib/brands";
import applyDefaultBrand from "~/lib/brands/apply-default";
import fromCourierObject from "~/lib/brands/from-courier-object";
import { BrandCourierObject, IGetFnOptions } from "~/lib/brands/types";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import materializedObjectService from "~/objects/services/materialized-objects";
import { IBrand } from "~/types.api";
import getDefaultBrand from "./get-default-brand";

type GetBrand = (
  tenantId: string,
  brandId: string,
  options?: IGetFnOptions
) => Promise<IBrand>;

const getBrand: GetBrand = async (
  tenantId: string,
  brandId: string,
  options?: IGetFnOptions
) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return get(tenantId, brandId, options);
  }

  const materializedObjects = materializedObjectService(tenantId);

  const id = convertBrandId(brandId);
  const item = await materializedObjects.get(id);
  if (!item || !item.objtype) {
    return get(tenantId, brandId, options);
  }

  const brand = fromCourierObject(item as BrandCourierObject);

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  const isDefaultBrand = defaultBrandId === brand.id.split("/")[0];

  if (options && options.extendDefaultBrand) {
    const defaultBrand = await getDefaultBrand(tenantId);
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
