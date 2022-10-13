import { APIGatewayAuthorizerResult } from "aws-lambda";
import { decodeClientKey, sanitizeArn } from "./lib";
import generatePolicy, {
  ApiAuthorizerResult,
  IClientAuthorizerContext,
} from "~/lib/lambda-access-policy";
import { verify, decode } from "jsonwebtoken";
import { TenantScope } from "~/types.internal";
import { getUserIdsFromScopes } from "~/triggers/authorizers/lib";
import listApiKeys from "../tenant-service/list-api-keys";
import { ITenantAuthToken } from "../dynamo/tenant-auth-tokens";

export interface ClientJwtPayload {
  /**
   * Client Key can be used in place of tenant_id and tenant_scope. This allows customers
   * to sign their own tokens.
   */
  client_key?: string;

  tenant_id?: string;

  tenant_scope?: TenantScope;

  /**
   * Space separated list of scopes.
   * user ids take the format user_id:my-user-id. Multiple can be listed.
   * read scopes should be prefixed with "read:" and write scopes should be prefixed with "write:".
   */
  scope?: string;
}

/**
 * Authorizes a Client JWT. Ensures the JWT has a valid signature and is signed by the tenant
 * it claims to be signed by. Attaches scope to context.
 */
export async function authorizeClientJwt({
  methodArn,
  jwt,
}: {
  methodArn: string;
  jwt: string;
}): Promise<ApiAuthorizerResult> {
  const arn = sanitizeArn(methodArn);
  const decoded = decode(jwt) as ClientJwtPayload;

  if (!decoded || !(decoded instanceof Object)) {
    throw new Error("Unauthorized");
  }

  const { tenantId, tenantScope, decodedId, env } = getDecodedTenant(decoded);
  const authTokens = await assertAuthTokens(tenantId, tenantScope);

  const isJwtAuthResults = await Promise.all(
    authTokens.map((token) => jwtIsAuthorized(jwt, token))
  );

  if (!isJwtAuthResults.some((result) => result)) {
    throw new Error("Unauthorized");
  }

  const userIds = getUserIdsFromScopes((decoded.scope ?? "").split(" "));

  return generatePolicy("user", "Allow", arn, {
    env,
    scope: tenantScope,
    tenantId,
    userId: userIds.length === 1 ? userIds[0] : undefined,
    userIds: userIds.length > 1 ? userIds.join(",") : undefined, // Policy contexts do no support arrays.
    authScope: decoded.scope,
    authType: "client-jwt",
  } as IClientAuthorizerContext);
}

const jwtIsAuthorized = (jwt, authToken): Promise<boolean> =>
  new Promise((resolve) => {
    verify(jwt, authToken, (err) => {
      if (err) {
        return resolve(false);
      }

      resolve(true);
    });
  });

/** Requires tenantId without env (i.e. not decodedId) */
const assertAuthTokens = async (tenantId: string, scope: string) => {
  const authTokens = await listApiKeys(tenantId);
  const tokens = authTokens
    .filter(
      ({ authToken, scope: s }: Partial<ITenantAuthToken> = {}) =>
        authToken && s === scope
    )
    .map(({ authToken }) => authToken);

  if (!tokens?.length) {
    throw new Error("Unauthorized");
  }

  return tokens;
};

export function getDecodedTenant(decoded: ClientJwtPayload): {
  /** Tenant id without the env */
  tenantId: string;
  tenantScope: TenantScope;
  /** DecodedId is the full tenantId including env i.e. 1234-1232-12312/test */
  decodedId: string;
  env?: string;
} {
  const { tenant_id, tenant_scope, client_key } = decoded;

  if ((!tenant_id || !tenant_scope) && !client_key) {
    throw new Error("Unauthorized");
  }

  if (client_key) {
    const { tenantId, env, decodedId } = decodeClientKey(client_key);
    return {
      tenantId,
      tenantScope: env === "test" ? "published/test" : "published/production",
      decodedId,
      env,
    };
  }

  const [tenantId, env] = tenant_id.split("/");

  return {
    tenantId,
    tenantScope: tenant_scope,
    decodedId: tenant_id,
    env,
  };
}
