import {
  convertBrandId,
  getDefaultBrandId,
  getLatest,
  overlayMetadata,
} from "~/lib/brands";
import fromCourierObject from "~/lib/brands/from-courier-object";
import { BrandCourierObject } from "~/lib/brands/types";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import materializedObjectService from "~/objects/services/materialized-objects";
import { IBrand } from "~/types.api";
import getBrand from "./get-brand";

type GetLatestBrand = (tenantId: string, id: string) => Promise<IBrand>;

const getLatestBrand: GetLatestBrand = async (tenantId: string, id: string) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return getLatest(tenantId, id);
  }

  const materializedObjects = materializedObjectService(tenantId);

  const brandId = convertBrandId(id);
  const brand = await getBrand(tenantId, brandId);
  const latest = await materializedObjects.get(brandId, {
    latest: true,
  });

  if (!latest || !latest.objtype) {
    return getLatest(tenantId, id);
  }

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  return {
    ...fromCourierObject(overlayMetadata(latest as BrandCourierObject, brand)),
    isDefaultBrand: defaultBrandId === brand.id.split("/")[0],
  };
};

export default getLatestBrand;
