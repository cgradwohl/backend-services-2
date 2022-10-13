import { Unit } from "aws-embedded-metrics";
import { APIGatewayAuthorizerEvent } from "aws-lambda";
import { CourierEmf } from "../courier-emf";
import logger from "../logger";

export const sanitizeArn = (methodArn: string): string => {
  // https://medium.com/asked-io/serverless-custom-authorizer-issues-on-aws-57a40176f63f
  return methodArn.split("/").slice(0, 2).join("/") + "/*";
};

export const decodeClientKey = (
  clientKey: string
): { tenantId?: string; env?: string; decodedId?: string } => {
  const decodedId = Buffer.from(clientKey, "base64").toString("utf-8");
  const [tenantId, env] = decodedId?.split("/") ?? [undefined, undefined];
  return { tenantId, env, decodedId };
};

export const getAuthTokenFromAuthEvent = (event: APIGatewayAuthorizerEvent) =>
  parseAuthHeader(getBearerTokenFromAuthEvent(event));

export const getBearerTokenFromAuthEvent = (
  event: APIGatewayAuthorizerEvent
): string | undefined => {
  if (event.type === "TOKEN") {
    return event.authorizationToken;
  }

  return event.headers["Authorization"] ?? event.headers["authorization"];
};

export const parseAuthHeader = (
  authorizationHeader?: string
): string | undefined => {
  if (!authorizationHeader || !authorizationHeader.length) {
    return undefined;
  }

  const match = authorizationHeader.match(/(Bearer|Basic) (.*)/);
  if (!match) {
    return undefined;
  }

  const [, mode, authToken] = match;
  if (!authToken) {
    return undefined;
  }

  switch (mode) {
    case "Bearer":
      return authToken;
    case "Basic": {
      const buff = Buffer.from(authToken, "base64");
      const pairOrToken = buff.toString("ascii");

      // support for username:password basic auth
      if (pairOrToken.indexOf(":") > 0 && !pairOrToken.endsWith(":")) {
        const [, authToken2] = pairOrToken.split(":");
        return authToken2;
      }

      // support for auth token (e.g. segment destination)
      // segment adds a : to the end of the auth token
      // (blank password essentially)
      return pairOrToken.slice(0, -1);
    }
    default:
      return undefined;
  }
};

/**
 * Returns a hash code from a string
 * @param  {String} awsRequestId The string to hash.
 * @return {Number} A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
const hashCode = (awsRequestId) => {
  let hash = 0;
  for (let i = 0, len = awsRequestId.length; i < len; i++) {
    let chr = awsRequestId.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 100);
};

interface IsMeteredOpts {
  percent: number;
  tenantId: string;
  awsRequestId: string;
  type?: "translation" | "delivery" | "use-route-tree";
}

async function isMetered({
  percent,
  tenantId,
  awsRequestId,
  type = "translation",
}: IsMeteredOpts): Promise<boolean> {
  const metrics = new CourierEmf("TrafficMeter");
  const flag = hashCode(awsRequestId) >= 100 - percent;
  metrics.addDimensions([
    { Function: "Metering" },
    { Function: "Metering", Type: type },
  ]);
  metrics.addMetrics([
    { metricName: String(flag), unit: Unit.Count, value: 1 },
  ]);
  metrics.addProperties([{ tenantId }]);
  await metrics.end();
  return flag;
}

export const isTranslateMetered = async ({
  awsRequestId,
  percent,
  tenantId,
}: Omit<IsMeteredOpts, "type">) => {
  return await isMetered({
    awsRequestId,
    percent,
    tenantId,
  });
};

export const isDeliveryMetered = async ({
  awsRequestId,
  percent,
  tenantId,
}: Omit<IsMeteredOpts, "type">) => {
  return await isMetered({
    awsRequestId,
    percent,
    tenantId,
    type: "delivery",
  });
};

export const isUseRouteTreeMetered = async ({
  awsRequestId,
  percent,
  tenantId,
}: Omit<IsMeteredOpts, "type">) => {
  return await isMetered({
    awsRequestId,
    percent,
    tenantId,
    type: "use-route-tree",
  });
};

export const validateFlags = async ({
  allowTranslation,
  awsRequestId,
  blockTranslation,
  shouldTranslateAndDeliver = false,
  tenantId,
  trafficPercentageToValidate,
}: {
  allowTranslation: boolean;
  awsRequestId: string;
  blockTranslation: boolean;
  shouldTranslateAndDeliver: boolean;
  tenantId: string;
  trafficPercentageToValidate: number;
}): Promise<boolean> => {
  if (shouldTranslateAndDeliver === true) {
    return false;
  }
  /**
   * If it doesn't have a feature flag to allow or block
   * we meter the traffic using the percentage value
   *
   * NOTE: This applies to all tenants that do not have an allow list or block list FF
   */
  if (!allowTranslation && !blockTranslation) {
    return await isTranslateMetered({
      percent: trafficPercentageToValidate,
      tenantId,
      awsRequestId,
    });
  } else if (blockTranslation) {
    return false;
  }
  return true;
};

export const validateDeliveryFlags = async ({
  allowTranslationAndDelivery,
  awsRequestId,
  blockTranslationAndDelivery = true, // default to block translate and delivery
  tenantId,
  trafficPercentageToDeliver,
}: {
  allowTranslationAndDelivery: boolean;
  awsRequestId: string;
  blockTranslationAndDelivery: boolean;
  tenantId: string;
  trafficPercentageToDeliver: number;
}): Promise<boolean> => {
  try {
    if (blockTranslationAndDelivery === true) {
      return false;
    }

    if (allowTranslationAndDelivery === true) {
      return true;
    }

    return await isDeliveryMetered({
      percent: trafficPercentageToDeliver,
      tenantId,
      awsRequestId,
    });
  } catch (error) {
    logger.error("::: DELIVERY FLAG ERROR :::");
    logger.error(error);

    return false;
  }
};
