import { UserInputError } from "apollo-server-lambda";
import {
  createKey,
  deleteKey,
  getKey,
  ITenantAuthToken,
  queryByTenantId,
} from "~/lib/dynamo/tenant-auth-tokens";
import { findPricingPlan } from "~/lib/plan-pricing";
import * as tenants from "~/lib/tenant-service";
import rotateAuthToken, {
  TokenNotFound,
} from "~/lib/tenant-service/rotate-auth-token";
import { TenantRouting, TenantScope } from "~/types.internal";
import DataSource from "../lib/data-source";

export default class ApiKeysDataSource extends DataSource {
  get objtype(): string {
    return "apiKey";
  }

  public async create(
    scope: TenantScope,
    user: { email: string; id: string },
    name?: string,
    dryRunKey?: TenantRouting
  ) {
    const tenantId = this.getEnvScopedTenantId();
    const tenant = await tenants.get(tenantId);
    const plan = findPricingPlan(tenant.stripeSubscriptionItemPriceId);

    if (plan !== "custom") {
      return { success: false };
    }
    await createKey(scope, tenantId, user, name, dryRunKey);
    return { success: true };
  }

  public async delete(key: string, user: { email: string; id: string }) {
    const tenantId = this.getEnvScopedTenantId();
    const tenant = await tenants.get(tenantId);
    const plan = findPricingPlan(tenant.stripeSubscriptionItemPriceId);

    if (plan !== "custom") {
      return { success: false };
    }
    await deleteKey(key, tenantId, user);
    return { success: true };
  }

  public async get(key: string) {
    const tenantId = this.getEnvScopedTenantId();
    const token = await getKey(key);

    if (token.tenantId !== tenantId) {
      return null;
    }
    return token ? this.map(token) : null;
  }

  public async list() {
    const scopedTenantId = this.getEnvScopedTenantId();
    const [tenantId, userScope] = scopedTenantId.split("/");

    const tokens = await queryByTenantId(tenantId);
    if (!tokens?.length) {
      return { items: [] };
    }

    return {
      items: tokens
        .filter(
          (token) => !userScope || userScope === token.scope.split("/")[1]
        )
        .map(this.map),
    };
  }

  public async rotate(key: string, user: { email: string; id: string }) {
    const tenantId = this.getEnvScopedTenantId();

    try {
      const token = await rotateAuthToken(user, tenantId, key);
      return { token };
    } catch (err) {
      if (err instanceof TokenNotFound) {
        throw new UserInputError("Invalid API key");
      }

      throw err;
    }
  }

  protected map = (token: ITenantAuthToken) => {
    if (!token) {
      return null;
    }
    const { created, authToken, name, dryRunKey, scope } = token;

    return {
      created,
      id: authToken,
      name,
      dryRunKey,
      scope,
    };
  };
}
