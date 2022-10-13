import { createHmac } from "crypto";
import { getByProvider } from "~/lib/configurations-service";
import { queryByTenantId } from "~/lib/dynamo/tenant-auth-tokens";
import generatePolicy, {
  IClientAuthorizerContext,
} from "~/lib/lambda-access-policy";
import logger from "~/lib/logger";
import { get as getTenant } from "~/lib/tenant-service";
import { decodeClientKey, sanitizeArn } from "./lib";

export const unauthorizedMessage = "Unauthorized";

export async function authorizeClientKey({
  headers,
  methodArn,
}: {
  headers?: { [key: string]: string | undefined };
  methodArn: string;
}) {
  const arn = sanitizeArn(methodArn);
  const clientKey = headers?.["x-courier-client-key"];
  const userId = headers?.["x-courier-user-id"];
  const origin = headers?.Origin ?? headers?.origin;

  if (!clientKey) {
    logger.debug("Missing Client Key");
    throw new Error(unauthorizedMessage);
  }

  const { tenantId, env, decodedId } = decodeClientKey(clientKey);

  logger.debug({
    tenantId,
    env,
  });

  if (!tenantId) {
    logger.debug("Missing Tenant Id");
    throw new Error(unauthorizedMessage);
  }

  // validate that its a known tenant
  const tenant = await getTenant(tenantId);

  if (!tenant) {
    logger.debug("Cannot Find Tenant");
    throw new Error(unauthorizedMessage);
  }

  // retrieve apiKey for the tenant
  const authTokens = await queryByTenantId(tenantId);
  const liveScope = env === "test" ? "published/test" : "published/production";
  const draftScope = env === "test" ? "draft/test" : "draft/production";

  const liveAuthToken = authTokens.find(
    ({ scope: s }) => s === liveScope
  )?.authToken;
  const draftAuthToken = authTokens.find(
    ({ scope: s }) => s === draftScope
  )?.authToken;

  logger.debug({
    liveScope,
    draftScope,
  });

  if (!liveAuthToken || !draftAuthToken) {
    logger.debug("Cannot Find Auth Token");
    throw new Error(unauthorizedMessage);
  }

  const courierProvider = await getByProvider(tenantId, "courier");
  const providerConfig =
    env === "test" ? courierProvider?.json?.test : courierProvider?.json;

  if (providerConfig && providerConfig?.domains) {
    const domainsString = providerConfig?.domains as string;
    const domainsArray = domainsString.split(",");

    if (
      !domainsArray.some((domain) => {
        const re = new RegExp(domain.trim());
        return re.test(origin);
      })
    ) {
      logger.debug("Invalid Origin");
      throw new Error(unauthorizedMessage);
    }
  }

  // enforce hmac for /send
  if (courierProvider?.json?.hmacEnabled) {
    const userSignature = headers?.["x-courier-user-signature"];

    if (!userSignature) {
      logger.debug("Missing User Signature");
      throw new Error(unauthorizedMessage);
    }

    if (!userId) {
      logger.debug("Missing User Id");
      throw new Error(unauthorizedMessage);
    }

    const computedLiveUserHmac = createHmac("sha256", liveAuthToken)
      .update(userId)
      .digest("hex");

    const computedDraftUserHmac = createHmac("sha256", draftAuthToken)
      .update(userId)
      .digest("hex");

    if (
      computedLiveUserHmac !== userSignature &&
      computedDraftUserHmac !== userSignature
    ) {
      logger.debug("HMAC Invalid");
      throw new Error(unauthorizedMessage);
    }
  }

  return generatePolicy("user", "Allow", arn, {
    env,
    scope: env === "test" ? "published/test" : "published/production",
    tenantId,
    userId,
    authType: courierProvider?.json?.hmacEnabled ? "client-hmac" : "client-key",
  } as IClientAuthorizerContext);
}
