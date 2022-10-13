import apiFeatureService from "~/lib/api-feature-service";
import { getKey as getTenantAuthToken } from "~/lib/dynamo/tenant-auth-tokens";
import generatePolicy, {
  IApiAuthorizerContext,
} from "~/lib/lambda-access-policy";
import { ApiVersion } from "~/send/types";
import {
  isUseRouteTreeMetered,
  sanitizeArn,
  validateDeliveryFlags,
  validateFlags,
} from "./lib";

export const defaultRouteToV2Value = false;
export const getApiVersion = (isRouteToV2Enabled): ApiVersion =>
  isRouteToV2Enabled ? "2021-11-01" : "2019-04-01";

export async function authorizeApiKey({
  apiKey,
  awsRequestId,
  methodArn,
}: {
  apiKey: string;
  awsRequestId: string;
  methodArn: string;
}) {
  const arn = sanitizeArn(methodArn);

  const authTokenObj = await getTenantAuthToken(apiKey);
  if (!authTokenObj) {
    throw new Error("Unauthorized");
  }

  const { dryRunKey, scope, tenantId: unscopedTenantId } = authTokenObj;
  const [, environment] = scope.split("/") ?? [undefined, undefined];
  const tenantId =
    environment === "production"
      ? unscopedTenantId
      : `${unscopedTenantId}/${environment}`;

  const [
    variation,
    useMaterializedBrands,
    allowTranslation, // TODO: Clean up unused flag
    blockTranslation, // TODO: Clean up unused flag
    TRAFFIC_PERCENTAGE_TO_BE_TRANSLATED,
    allowTranslationAndDelivery, // TODO: Clean up unused flag
    blockTranslationAndDelivery,
    TRANSLATE_AND_DELIVERY_TRAFFIC_PERCENTAGE,
    useRouteTreePercent, // TODO: Clean up unused flag
  ] = await Promise.all([
    apiFeatureService(tenantId).variation<boolean>(
      "route_to_v2",
      defaultRouteToV2Value
    ),
    apiFeatureService(tenantId).variation<boolean>(
      "use_materialized_brands",
      true
    ),
    false, // allow_translate
    false, // block_translate
    apiFeatureService("TRAFFIC").variation<number>("METER", 0), // TODO: Remove when we are done

    false, // allow_translate_and_delivery
    apiFeatureService(tenantId).variation<boolean>(
      "block_translate_and_delivery",
      false
    ),
    apiFeatureService("TRAFFIC").variation<number>("DELIVERY_METER", 0), // TODO: Remove when we are done,
    100, // USE_ROUTE_TREE
  ]);

  const [shouldTranslateAndDeliver, shouldUseRouteTree] = await Promise.all([
    validateDeliveryFlags({
      allowTranslationAndDelivery,
      awsRequestId,
      blockTranslationAndDelivery,
      tenantId,
      trafficPercentageToDeliver: TRANSLATE_AND_DELIVERY_TRAFFIC_PERCENTAGE,
    }),
    isUseRouteTreeMetered({
      percent: useRouteTreePercent,
      tenantId,
      awsRequestId,
    }),
  ]);

  const shouldTranslateAndVerify = await validateFlags({
    allowTranslation,
    awsRequestId,
    blockTranslation,
    shouldTranslateAndDeliver,
    tenantId,
    trafficPercentageToValidate: TRAFFIC_PERCENTAGE_TO_BE_TRANSLATED,
  });

  const apiVersion = getApiVersion(variation);

  const authorizerContext: IApiAuthorizerContext = {
    apiVersion,
    dryRunKey,
    scope,
    tenantId,
    useMaterializedBrandsString: String(useMaterializedBrands),
    translateToV2String: String(shouldTranslateAndVerify),
    shouldTranslateAndDeliverString: String(shouldTranslateAndDeliver),
    shouldUseRouteTreeString: String(shouldUseRouteTree),
    authType: "api-key",
  };

  return generatePolicy("user", "Allow", arn, authorizerContext);
}
