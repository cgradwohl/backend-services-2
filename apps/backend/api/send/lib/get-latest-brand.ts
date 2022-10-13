import {
  convertBrandId,
  getDefaultBrandId,
  getLatest,
  overlayMetadata,
} from "~/lib/brands";
import fromCourierObject from "~/lib/brands/from-courier-object";
import { BrandCourierObject } from "~/lib/brands/types";
import logger from "~/lib/logger";
import materializedObjectService from "~/objects/services/materialized-objects";
import { IBrand } from "~/types.api";
import getBrand from "./get-brand";

type GetLatestBrand = (
  tenantId: string,
  id: string,
  useMaterializedBrands: boolean
) => Promise<IBrand>;

const getLatestBrand: GetLatestBrand = async (
  tenantId: string,
  id: string,
  useMaterializedBrands: boolean
) => {
  if (!useMaterializedBrands) {
    logger.debug(
      `Materialized store lookup disabled for tenantId ${tenantId}, fallback to getLatest`
    );
    return getLatest(tenantId, id);
  }

  const materializedObjects = materializedObjectService(tenantId);

  const brandId = convertBrandId(id);
  const latest = await materializedObjects.get(brandId, {
    latest: true,
  });

  if (!latest) {
    logger.debug(
      `tenantId/brandId ${tenantId}/${brandId} with latest=true not found in materialized store, fallback to getLatest`
    );
    return getLatest(tenantId, id);
  }

  const brand = await getBrand(tenantId, brandId, useMaterializedBrands);
  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  return {
    ...fromCourierObject(overlayMetadata(latest as BrandCourierObject, brand)),
    isDefaultBrand: defaultBrandId === brand.id.split("/")[0],
  };
};

export default getLatestBrand;
