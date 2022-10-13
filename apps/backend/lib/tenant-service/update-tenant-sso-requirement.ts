import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import dynamoStoreService from "../dynamo/store-service";
import { ITenantDynamoObject, IUserSsoProvider } from "~/types.api";
import { ITenantKey } from "./types";
import { isValidSsoProvider } from "../cognito/sso";

const tableName = getTableName(TABLE_NAMES.TENANTS_TABLE_NAME);

export async function updateTenantSsoRequirement(
  tenantId: string,
  ssoProvider?: IUserSsoProvider
): Promise<void> {
  const service = dynamoStoreService<ITenantDynamoObject, ITenantKey>(
    tableName
  );

  if (ssoProvider && !isValidSsoProvider(ssoProvider)) {
    throw new Error(`Invalid sso provider: ${ssoProvider}`);
  }

  await service.update({ tenantId }, { requireSso: ssoProvider });
}
