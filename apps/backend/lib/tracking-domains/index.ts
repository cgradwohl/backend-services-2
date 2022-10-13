import * as dynamo from "~/lib/dynamo";
import getEnvVar from "../get-environment-variable";
import { ITrackingDomain } from "./types";

// exposed for future use
export const findTenantsByDomain = async (
  tenantDomain: string
): Promise<ITrackingDomain[]> => {
  const { Items } = await dynamo.query({
    ExpressionAttributeValues: {
      ":tenantDomain": tenantDomain,
    },
    KeyConditionExpression: "tenantDomain = :tenantDomain",
    TableName: process.env.TRACKING_DOMAINS_TABLE_NAME,
  });

  if (!Items.length) {
    return null;
  }
  return Items as ITrackingDomain[];
};

// exposed for future use
// call for each env to limit any impact across env
// for instance: tenantId for prod, tenantId-test for test and so on
export const createTrackingDomain = async (
  tenantDomain: string,
  tenantId: string,
  creator: string
): Promise<ITrackingDomain> => {
  const item: ITrackingDomain = {
    created: Date.now(),
    creator,
    tenantDomain,
    tenantId,
  };

  await dynamo.update({
    ConditionExpression:
      "attribute_not_exists(#tenantDomain) AND attribute_not_exists(#tenantId)",
    ExpressionAttributeNames: {
      "#created": "created",
      "#creator": "creator",
      "#tenantDomain": "tenantDomain",
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":created": item.created,
      ":creator": item.creator,
      ":tenantDomain": item.tenantDomain,
    },
    Key: { tenantDomain, tenantId },
    TableName: process.env.TRACKING_DOMAINS_TABLE_NAME,
    UpdateExpression: "SET #created = :created, #creator = :creator",
  });

  return item;
};

export const deleteTrackingDomain = async (
  tenantDomain: string,
  tenantId: string
) => {
  await dynamo.deleteItem({
    Key: { tenantDomain, tenantId },
    TableName: process.env.TRACKING_DOMAINS_TABLE_NAME,
  });
};

// exported for mocking in tests
export const getDomainByTenant = async (
  tenantId: string
): Promise<ITrackingDomain> => {
  const results = await dynamo.query({
    ExpressionAttributeNames: { "#tenantId": "tenantId" },
    ExpressionAttributeValues: { ":tenantId": tenantId },
    IndexName: "ByTenant",
    KeyConditionExpression: "#tenantId = :tenantId",
    TableName: getEnvVar("TRACKING_DOMAINS_TABLE_NAME"),
  });

  return results.Items[0] as ITrackingDomain;
};

export const getTrackingDomain = async (
  fullTenantId: string
): Promise<string> => {
  const [tenantId, env] = fullTenantId.split("/");

  // search by prefix so this can be configured per env
  const prefix = env ? `${tenantId}-${env}` : tenantId;
  const trackingDomain = await getDomainByTenant(prefix);

  // if a custom domain is registered, use it
  if (trackingDomain?.tenantDomain) {
    return trackingDomain.tenantDomain;
  }

  // fall back to the shared domain registration
  if (process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME) {
    return process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME;
  }

  // return undefined if no previous cases met. api gateway url will be used.
};
