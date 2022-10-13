import { batchGet, query } from "~/lib/dynamo";
import { getUserCount } from "~/lib/tenant-service";
import { ITenant, TenantsGetResponseTenant } from "~/types.api";
import chunkArray from "../chunk-array";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";

export default async (userId: string) => {
  const accessRightsRes = await query({
    ExpressionAttributeValues: {
      ":userId": userId,
    },
    KeyConditionExpression: "userId = :userId",
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  if (!accessRightsRes?.Items?.length) {
    return [];
  }

  const batches = chunkArray(
    accessRightsRes?.Items as [{ tenantId: string }],
    50
  );
  const responses = await Promise.all(
    batches.map(async (batch) => {
      return batchGet({
        RequestItems: {
          [getTableName(TABLE_NAMES.TENANTS_TABLE_NAME)]: {
            AttributesToGet: ["name", "tenantId", "created", "archived"],
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
    if (tenant.archived) {
      continue;
    }

    const userCount: number = await getUserCount(tenant.tenantId);
    response.push({
      name: tenant.name,
      requireSso: tenant.requireSso,
      tenantId: tenant.tenantId,
      userCount,
    });
  }

  return response;
};
