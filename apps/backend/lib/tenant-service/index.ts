import { adminGetUser } from "~/lib/cognito/identity-service-provider";
import { getSignInProvider } from "~/lib/cognito/sso";
import { hasCourierEmail, isCourierUser } from "~/lib/courier-internal";
import { ITenant, ITenantDynamoObject } from "~/types.api";

import { getItem, query } from "~/lib/dynamo";
import { FREE_PLAN_NOTIFICATION_CAP } from "~/studio/billing";
import dynamoStoreService from "../dynamo/store-service";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import getTenantInfo from "../get-tenant-info";
import { findPricingPlan } from "../plan-pricing";
import { ITenantKey } from "./types";

export { default as list } from "./list";
export { default as listByDomain } from "./list-by-domain";
export { default as listByInvitedEmail } from "./list-by-invited-email";
export * from "./update-tenant-sso-requirement";

const tableName = getTableName(TABLE_NAMES.TENANTS_TABLE_NAME);
const service = dynamoStoreService<ITenantDynamoObject, ITenantKey>(tableName);

export const get = async (tenantId: string): Promise<ITenant | undefined> => {
  tenantId = tenantId.replace("/test", "");
  const tenant = await service.get({ tenantId });

  if (!tenant || tenant?.archived) {
    return;
  }

  let { domains = [], requireSso } = tenant;
  const {
    googleSsoDomain,
    gracePeriodEnd,
    usageCurrentPeriod,
    stripeSubscriptionItemPriceId,
  } = tenant;

  if (googleSsoDomain) {
    requireSso = "google";

    domains = [...domains, googleSsoDomain].filter(
      (value, index, self) => self.indexOf(value) === index
    );

    delete tenant.googleSsoDomain;
  }

  const currTime = new Date().getTime();

  const plan = findPricingPlan(stripeSubscriptionItemPriceId);

  if (plan === "good") {
    return {
      ...tenant,
      isInGracePeriod: currTime < gracePeriodEnd,
      isOverSendLimit: usageCurrentPeriod > FREE_PLAN_NOTIFICATION_CAP,
      domains,
      requireSso,
    };
  }

  return {
    ...tenant,
    isInGracePeriod: false,
    isOverSendLimit: false,
    domains,
    requireSso,
  };
};

export const remove = service.remove;
export const scan = service.scan;
export const update = service.update;

export const trackUsage = async ({
  billedUnits,
  tenantId,
}: {
  billedUnits: number;
  tenantId: string;
}) => {
  const key = {
    tenantId: getTenantInfo(tenantId).tenantId,
  };
  await service.dynamodb.update({
    ExpressionAttributeNames: {
      "#usageActual": "usageActual",
      "#usageCurrentPeriod": "usageCurrentPeriod",
    },
    ExpressionAttributeValues: {
      ":increment": billedUnits,
      ":start": 0,
    },
    Key: key,
    TableName: tableName,
    UpdateExpression:
      "SET #usageActual = if_not_exists(#usageActual, :start) + :increment, #usageCurrentPeriod = if_not_exists(#usageCurrentPeriod, :start) + :increment",
  });
};

export const listTenantUsers = async ({
  userId,
  tenantId,
  userPoolId,
}: {
  userId: string;
  tenantId: string;
  userPoolId: string;
}) => {
  const accessRightsRes = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  if (!accessRightsRes.Items.find((user) => user.userId === userId)) {
    throw new Error("Unauthorized");
  }

  const { Item: tenant } = await getItem({
    Key: {
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
  });

  const owner = tenant.owner || tenant.creator;
  const users = await Promise.all(
    accessRightsRes.Items.map(async (accessRight) => {
      const user = await adminGetUser({
        UserPoolId: userPoolId,
        Username: accessRight.userId,
      });

      const emailAttribute = user.UserAttributes.find(
        (attr) => attr.Name === "email"
      );

      const emailVerified = user.UserAttributes.find(
        (attr) => attr.Name === "email_verified"
      );

      const id = accessRight.userId;
      const provider = getSignInProvider(id);

      return {
        email: emailAttribute.Value,
        id: accessRight.userId,
        owner: id === owner ? true : false,
        provider,
        role: accessRight.role,
        verified: emailVerified.Value === "false" ? false : true,
      };
    })
  );

  // filter out courier employees for external users
  const filteredUsers = (await isCourierUser(userId))
    ? users
    : users.filter((user) => !hasCourierEmail(user?.email));

  return filteredUsers;
};

export const getUserCount = async (tenantId: string) => {
  const accessRightsRes = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
      ":isCourierEmployee": true,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    FilterExpression: "isCourierEmployee <> :isCourierEmployee",
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  // won't return expected results if there is more than 1MB of data (aka it's paged)
  // If we need a true (reliable count) we would have to inspect the last evaluated key
  // and perform exhaustive paging and aggregate the results.
  return accessRightsRes.Count;
};
