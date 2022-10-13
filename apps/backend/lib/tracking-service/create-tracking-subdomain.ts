import { Route53 } from "aws-sdk";
import logger from "~/lib/logger";

const route53 = new Route53({ apiVersion: "2013-04-01" });

export const createTrackingSubdomainForTenant = async (tenantId: string) => {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("TenantId must be a string");
  }

  const params = {
    ChangeBatch: {
      Changes: [
        {
          Action: "CREATE",
          ResourceRecordSet: {
            AliasTarget: {
              DNSName: process.env.CLICK_THROUGH_TRACKING_ALIAS_TARGET_DNS_NAME,
              EvaluateTargetHealth: false,
              HostedZoneId:
                process.env.CLICK_THROUGH_TRACKING_ALIAS_TARGET_HOSTED_ZONE_ID,
            },
            Name: `${tenantId}.${process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME}`,
            Type: "A",
          },
        },
      ],
    },
    HostedZoneId: process.env.CLICK_THROUGH_TRACKING_HOSTED_ZONE,
  };

  logger.debug(params);

  try {
    return await route53.changeResourceRecordSets(params).promise();
  } catch (err) {
    if (
      err.message &&
      typeof err.message === "string" &&
      err.message.match(
        /Tried to create resource record set .* but it already exists/
      )
    ) {
      logger.warn(`Route53 record already exists for tenantId [${tenantId}]`);
      return; // I'm assuming record is good
    }
    throw err;
  }
};
