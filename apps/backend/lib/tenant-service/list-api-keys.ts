import { query } from "../dynamo";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { ITenantAuthToken } from "../dynamo/tenant-auth-tokens";

export default async (tenantId: string): Promise<ITenantAuthToken[]> => {
  const apiKeys = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });

  return (apiKeys?.Items as ITenantAuthToken[]) ?? [];
};
