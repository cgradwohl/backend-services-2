import { getUser } from "~/lib/cognito";
import { query, update } from "~/lib/dynamo";
import handleErrorLog from "~/lib/handle-error-log";
import {
  BadRequest,
  InternalServerError,
  Unauthorized,
} from "~/lib/http-errors";
import {
  assertBody,
  CognitoRequestContext,
  handleCognito,
  handleRaw,
} from "~/lib/lambda-response";
import { verifyJwtMiddleware } from "~/lib/middleware";
import { updateUserDetails } from "~/lib/tenant-access-rights-service";
import { listTenantUsers } from "~/lib/tenant-service";

import {
  get as getTenant,
  listByDomain,
  listByInvitedEmail,
} from "~/lib/tenant-service";
import addTenantUser from "~/lib/tenant-service/add-user";
import createTenant from "~/lib/tenant-service/create";
import listTenants from "~/lib/tenant-service/list";

import {
  emitClickThroughTrackingDisabledEvent,
  emitClickThroughTrackingEnabledEvent,
} from "~/auditing/services/emit";
import assertHasCapability, {
  CapabilityAssertionError,
} from "~/lib/access-control/assert-has-capability";
import { getSignInProvider } from "~/lib/cognito/sso";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import logger from "~/lib/logger";
import { findPricingPlan } from "~/lib/plan-pricing";
import tenantsServiceListAltAccounts from "~/lib/tenant-service/list-alt-accounts";
import * as Types from "../types.api";
import { TenantsGetResponseTenant } from "../types.api";

export const create = handleRaw<Types.TenantsPostResponse>(async (context) => {
  if (!context.userId) {
    throw new Unauthorized();
  }

  // verify jwt middleware to enforce sessions are actually killed
  // when a user logs out
  await verifyJwtMiddleware(context, null);

  const {
    companyName,
    firstName,
    isFirstTenant,
    lastName,
    ownerName,
    marketingRole,
    workspaceName,
    workspaceOwnerRole,
    referral,
  } = assertBody(context);

  const gaClientId = context.event.queryStringParameters._ga;

  const allowedMarketingRoles = [
    "design-ux",
    "engineering",
    "marketing",
    "product",
    "support",
    "other",
  ];

  if (marketingRole && !allowedMarketingRoles.includes(marketingRole)) {
    throw new BadRequest("invalid primary role provided.");
  }

  const userId = context.userId;
  const user = await getUser(userId);

  if (isFirstTenant) {
    const tenants: TenantsGetResponseTenant[] = await listTenants(
      context.userId
    );
    const available: TenantsGetResponseTenant[] = await listByDomain(
      user.email.split("@")[1]
    );
    const invited: TenantsGetResponseTenant[] = await listByInvitedEmail(
      user.email
    );
    const tenant = tenants?.[0];

    if (tenants?.length || invited?.length || available?.length) {
      logger.warn(
        "C-4319 attempted to auto create new tenant when existing tenants exist"
      );
      return {
        body: {
          id: tenant?.tenantId,
          name: tenant?.name,
        },
      };
    }
  }

  const tenant = await createTenant(
    user,
    firstName,
    lastName,
    ownerName,
    workspaceName,
    referral,
    workspaceOwnerRole,
    {
      gaClientId,
    }
  );

  await updateUserDetails(
    firstName,
    lastName,
    marketingRole,
    tenant.tenantId,
    userId
  );

  return {
    body: {
      id: tenant.tenantId,
      name: tenant.name,
    },
  };
});

type GetAuthTokensFn = (context: CognitoRequestContext) => Promise<string[]>;
const getAuthTokens: GetAuthTokensFn = async (context) => {
  try {
    assertHasCapability(context.role, "apikey:ReadItem", "*");
  } catch (err) {
    if (err instanceof CapabilityAssertionError) {
      return [];
    }
    throw err;
  }
  const authTokens = await query({
    ExpressionAttributeValues: {
      ":tenantId": context.tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });

  return authTokens.Items && authTokens.Items.length
    ? authTokens.Items.map((item) => item.authToken)
    : [];
};

export const get = handleCognito<Types.TenantGetResponse>(async (context) => {
  // verify jwt middleware to enforce sessions are actually killed
  // when a user logs out
  try {
    await verifyJwtMiddleware(context, null);

    const tenant = await getTenant(context.tenantId);
    const authTokens = await getAuthTokens(context);

    return {
      body: {
        authTokens,
        brandsAccepted: tenant.brandsAccepted || false,
        clickThroughTracking: {
          enabled: false,
          ...tenant.clickThroughTracking,
        },
        created: tenant.created,
        currentOnboardingStep: tenant.currentOnboardingStep,
        customerRoutes: {
          hmacEnabled: false,
          ...tenant.customerRoutes,
        },
        discoverable: tenant.discoverable,
        domains: tenant.domains,
        emailOpenTracking: {
          enabled: false,
          ...tenant.emailOpenTracking,
        },
        id: tenant.tenantId,
        name: tenant.name,
        owner: tenant.owner || tenant.creator,
        paymentMethod: tenant.stripePaymentMethod,
        plan: findPricingPlan(tenant.stripeSubscriptionItemPriceId),
        requireSso: tenant.requireSso,
        showCourierFooter: tenant.showCourierFooter,
        hideSetupProgress: tenant.hideSetupProgress,
        stackLang: tenant.stackLang,
        usageActual: tenant.usageActual,
        usageCurrentPeriod: tenant.usageCurrentPeriod,
        gracePeriodStart: tenant.gracePeriodStart,
        gracePeriodEnd: tenant.gracePeriodEnd,
        isOverSendLimit: tenant.isOverSendLimit,
        isInGracePeriod: tenant.isInGracePeriod,
      },
    };
  } catch (err) {
    handleErrorLog(err);

    throw err;
  }
});

// Gets a list of alternative accounts (ones that are not logged into) using the user's email
// that have at least one tenant and, seperately, the provider currently logged in for
export const listAltAccounts = handleRaw<Types.TenantsListAltAccountsResponse>(
  async (context) => {
    if (!context.userId) {
      throw new Unauthorized();
    }
    // verify jwt middleware to enforce sessions are actually killed
    // when a user logs out
    await verifyJwtMiddleware(context, null);

    const user = await getUser(context.userId);
    const currentProvider = getSignInProvider(context.userId);
    const altAccounts = await tenantsServiceListAltAccounts(
      user.email,
      currentProvider
    );

    return {
      body: {
        altAccounts,
        currentProvider,
      },
    };
  }
);

export const list = handleRaw<Types.TenantsGetResponse>(async (context) => {
  if (!context.userId) {
    throw new Unauthorized();
  }

  // verify jwt middleware to enforce sessions are actually killed
  // when a user logs out
  await verifyJwtMiddleware(context, null);

  try {
    // Look here you get tenant info
    const tenants: TenantsGetResponseTenant[] = await listTenants(
      context.userId
    );
    const user = await getUser(context.userId);
    const available: TenantsGetResponseTenant[] = await listByDomain(
      user.email.split("@")[1]
    );
    const invited: TenantsGetResponseTenant[] = await listByInvitedEmail(
      user.email
    );

    return {
      body: {
        available: available
          .filter((t1) => !tenants.find((t2) => t2.tenantId === t1.tenantId))
          .filter((t1) => !invited.find((t2) => t2.tenantId === t1.tenantId)),
        invited,
        tenants,
      },
    };
  } catch (ex) {
    console.error(ex);
    throw new InternalServerError();
  }
});

export const listUsers = handleRaw<Types.TenantsListUsersResponse>(
  async (context) => {
    if (!context.userId) {
      throw new Unauthorized();
    }

    // verify jwt middleware to enforce sessions are actually killed
    // when a user logs out
    await verifyJwtMiddleware(context, null);

    const users = await listTenantUsers({
      tenantId: context.tenantId,
      userId: context.userId,
      userPoolId: context.userPoolId,
    });

    return {
      body: {
        users,
      },
    };
  }
);

// feature that allows users to be added to existing tenants via
// emailed invitation code feature
// or free-to-join tenants with email matching the approved domain
export const addUser = handleRaw<Types.TenantsPostResponse>(async (context) => {
  if (!context.userId) {
    throw new Unauthorized();
  }

  const userId = context.userId;
  const { invitationCode, tenantId, email } = assertBody(context);

  const tenant = await addTenantUser({
    email,
    invitationCode,
    tenantId,
    userId,
  });

  return {
    body: {
      id: tenant.tenantId,
      name: tenant.name,
    },
  };
});

export const setClickThroughTrackingSettings = async (
  tenantId: string,
  clickThroughTrackingSettings: Types.IClickThroughTrackingSettings,
  userId: string
) => {
  const { Attributes } = await update({
    ExpressionAttributeNames: {
      "#clickThroughTracking": "clickThroughTracking",
    },
    ExpressionAttributeValues: {
      ":clickThroughTrackingSettings": clickThroughTrackingSettings,
    },
    Key: {
      tenantId,
    },
    ReturnValues: "ALL_NEW",
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
    UpdateExpression:
      "set #clickThroughTracking = :clickThroughTrackingSettings",
  });

  let actor: { id: string; email: string };
  try {
    const { email } = await getUser(userId);
    actor = { email, id: userId };
  } catch (err) {
    actor = {
      email: "",
      id: userId,
    };
  }

  clickThroughTrackingSettings.enabled
    ? await emitClickThroughTrackingEnabledEvent(
        "published/production",
        new Date(),
        actor,
        tenantId
      )
    : await emitClickThroughTrackingDisabledEvent(
        "published/production",
        new Date(),
        actor,
        tenantId
      );

  return Attributes.clickThroughTracking as Types.IClickThroughTrackingSettings;
};

export const setEmailOpenTrackingSettings = async (
  tenantId: string,
  emailOpenTrackingSettings: Types.IEmailOpenTrackingSettings
) => {
  const { Attributes } = await update({
    ExpressionAttributeNames: {
      "#emailOpenTracking": "emailOpenTracking",
    },
    ExpressionAttributeValues: {
      ":emailOpenTrackingSettings": emailOpenTrackingSettings,
    },
    Key: {
      tenantId,
    },
    ReturnValues: "ALL_NEW",
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
    UpdateExpression: "set #emailOpenTracking = :emailOpenTrackingSettings",
  });

  return Attributes.emailOpenTracking as Types.IEmailOpenTrackingSettings;
};
