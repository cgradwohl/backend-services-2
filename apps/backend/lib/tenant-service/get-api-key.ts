import getTenantInfo from "~/lib/get-tenant-info";
import { publishedProductionScope } from "~/lib/tenant-service/token-scopes";
import { TenantScope } from "~/types.internal";
import listApiKeys from "./list-api-keys";

/** Scope defaults to published/{tenantId.environment} */
export const getApiKey = async (fullTenantId: string, scope?: TenantScope) => {
  const { environment, tenantId } = getTenantInfo(fullTenantId);
  const apiKeys = await listApiKeys(tenantId);

  if (!apiKeys?.length) {
    throw new Error(`API Key not found for tenant: ${fullTenantId}`);
  }

  scope =
    scope ??
    (environment ? `published/${environment}` : publishedProductionScope);

  const token = apiKeys.find(({ scope: s }) => s === scope);

  return token.authToken;
};

export default getApiKey;
