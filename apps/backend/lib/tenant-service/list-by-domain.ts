import { getTenantDomains } from "~/lib/domains";
import { batchGet } from "~/lib/dynamo";
import { getUserCount } from "~/lib/tenant-service";
import { ITenant, TenantsGetResponseTenant } from "~/types.api";
import chunkArray from "../chunk-array";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";

export default async (domain: string) => {
  const tenantDomains = await getTenantDomains(domain);

  if (!tenantDomains?.length) {
    return [];
  }

  const batches = chunkArray(tenantDomains, 50);
  const responses = await Promise.all(
    batches.map(async (batch) => {
      return batchGet({
        RequestItems: {
          [getTableName(TABLE_NAMES.TENANTS_TABLE_NAME)]: {
            AttributesToGet: [
              "name",
              "tenantId",
              "discoverable",
              "requireSso",
              "archived",
              "domains",
            ],
            Keys: batch?.map(({ tenantId }) => ({
              tenantId,
            })),
          },
        },
      });
    })
  );

  const tenants: ITenant[] = responses.reduce((acc, curr) => {
    acc = [
      ...acc,
      ...curr.Responses[getTableName(TABLE_NAMES.TENANTS_TABLE_NAME)],
    ];

    return acc;
  }, []);

  const response: TenantsGetResponseTenant[] = [];

  for (const tenant of tenants) {
    if (
      tenant.archived ||
      tenant.discoverable === "RESTRICTED" ||
      !(tenant.domains ?? []).includes(domain)
    ) {
      // ignore archived, restricted or mismatching domains
      continue;
    }

    const userCount: number = await getUserCount(tenant.tenantId);
    response.push({
      discoverable: tenant.discoverable,
      name: tenant.name,
      requireSso: tenant.requireSso,
      tenantId: tenant.tenantId,
      userCount,
    });
  }

  return response;
};
