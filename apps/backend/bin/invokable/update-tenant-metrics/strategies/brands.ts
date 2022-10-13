import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { list as listBrands } from "~/lib/brands";
import Strategy, { ITenantMetricCollection } from "./strategy";

import { CourierObject, IBrand, ITenant } from "~/types.api";

let brands: Array<CourierObject<IBrand>> = [];

const getBrands = async (tenantId: string) => {
  let lastKey: DocumentClient.Key;
  let results = [];

  do {
    const { items, lastEvaluatedKey } = await listBrands(tenantId, lastKey);
    if (items?.length) {
      results = results.concat(items);
    }
    lastKey = lastEvaluatedKey;
  } while (lastKey);

  brands = results;
};

const getBrandsCount = () => {
  return { brand_count: brands.length };
};

const getBrandsLastCreated = () => {
  brands.sort((a, b) => (new Date(a.created) > new Date(b.created) ? 1 : -1));

  const lastCreated = brands?.[0]?.created;

  return { brand_last_created: lastCreated };
};

const getBrandsLastUpdated = () => {
  brands.sort((a, b) => (new Date(a.updated) > new Date(b.updated) ? 1 : -1));

  const lastUpdated = brands.length > 0 ? brands[0].updated : undefined;

  return { brand_last_updated: lastUpdated };
};

export default class Brands extends Strategy {
  constructor() {
    super("brands");
  }

  public async collect(tenant: ITenant) {
    const { tenantId } = tenant;

    await getBrands(tenantId);

    const metrics: ITenantMetricCollection[] = [
      getBrandsCount(),
      getBrandsLastCreated(),
      getBrandsLastUpdated(),
    ];
    return metrics;
  }
}
