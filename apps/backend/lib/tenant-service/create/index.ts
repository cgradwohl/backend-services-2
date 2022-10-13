import { nanoid } from "nanoid";
import uuidv4 from "uuid/v4";
import { toApiKey } from "~/lib/api-key-uuid";
import { createDefaultBrand } from "~/lib/brands";
import { IUser, updateUser } from "~/lib/cognito";
import { isSsoUser } from "~/lib/cognito/sso";
import { subscribeInApp } from "~/lib/courier-in-app";
import { put, transactWrite } from "~/lib/dynamo";
import { update as updateProfile } from "~/lib/dynamo/profiles";
import { sendTrackEvent, trackUserScopedExperiment } from "~/lib/segment";
import getTableName, { TABLE_NAMES } from "../../dynamo/tablenames";
import { defaultScopes } from "../token-scopes";
import generateTenant from "./generate-tenant";
import courierClient from "~/lib/courier";
import logger from "~/lib/logger";

const generateTenantAccessRight = (userId: string, tenantId: string) => {
  return {
    created: new Date().getTime(),
    creator: userId,
    role: "ADMINISTRATOR",
    tenantId,
    userId,
  };
};

export default async (
  user: IUser,
  firstName?: string,
  lastName?: string,
  ownerName?: string,
  tenantName?: string,
  referral?: string,
  workspaceOwnerRole?: string,
  options?: {
    gaClientId?: string;
  }
) => {
  const tenant = await generateTenant(
    user.id,
    user.email,
    referral,
    tenantName
  );
  const { tenantId } = tenant;
  const accessRight = generateTenantAccessRight(user.id, tenantId);
  // generate 40 characters (similar to what API Gateway generates) api key
  // so that we don't confuse this with isApiKey logic
  const apiKey = nanoid(40);

  await put({
    Item: {
      ...tenant,
      apiKey,
    },
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
  });
  await put({
    Item: accessRight,
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  const created = new Date().getTime();
  const TransactItems = [...defaultScopes.entries()].map(([scope, prefix]) => ({
    Put: {
      Item: {
        apiKey,
        authToken: `${prefix}${toApiKey(uuidv4())}`,
        created,
        creator: user.id,
        scope,
        tenantId,
      },
      TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
    },
  }));
  await transactWrite({
    TransactItems,
  });

  // create default brand for tenant
  const defaultBrand = await createDefaultBrand(tenantId, user.id);
  await createDefaultBrand(`${tenantId}/test`, user.id, defaultBrand.id);
  // auto-create recipient profile to enable quickstart feature

  const name = ownerName
    ? ownerName
    : firstName && lastName
    ? `${firstName} ${lastName}`
    : undefined;

  await updateProfile(tenantId, user.id, {
    json: JSON.stringify({
      email: user.email,
      email_verified: true,
      family_name: lastName,
      given_name: firstName,
      name,
      sub: user.id,
    }),
  });

  await subscribeInApp(user.id, tenantId);
  await trackUserScopedExperiment({
    flagName: "devEx-a-a-test",
    tenantId,
    userId: user.id,
  });

  if (workspaceOwnerRole && process.env.STAGE !== "dev") {
    try {
      await courierClient().mergeProfile({
        recipientId: user.id,
        profile: {
          custom: {
            user_role: workspaceOwnerRole,
          },
        },
      });
    } catch (e) {
      logger.warn(e);
    }
  }

  await sendTrackEvent({
    body: {
      tenantName: tenant.name,
    },
    gaClientId: options?.gaClientId,
    key: "account-created",
    tenantId,
    userId: user.id,
  });

  // auto-verify email address if sso used to sign up
  if (isSsoUser(user.id)) {
    await updateUser(user.id, {
      email_verified: true,
    });
  }

  return tenant;
};
