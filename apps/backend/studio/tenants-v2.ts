import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import KoaRouter from "koa-router";
import {
  emitWorkspaceAccessibilityChangedEvent,
  emitWorkspaceDiscoverabilityDisabledEvent,
  emitWorkspaceDiscoverabilityEnabledEvent,
  emitWorkspaceSecuritySSODisabledEvent,
  emitWorkspaceSecuritySSOEnabledEvent,
} from "~/auditing/services/emit";
import { getUser } from "~/lib/cognito";
import { batchGet as getUsageForInterval } from "~/lib/daily-metrics-service";
import { addTenantToDomain, removeTenantFromDomain } from "~/lib/domains";
import { put } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import getEnvVar from "~/lib/get-environment-variable";
import { BadRequest, PaymentRequired } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import log from "~/lib/log";
import { findPricingPlan, PricingPlan } from "~/lib/plan-pricing";
import { sendTrackEvent } from "~/lib/segment";
import stripe from "~/lib/stripe";
import applyPromotionCode, {
  InvalidPromoCodeError,
} from "~/lib/tenant-service/apply-promotion-code";
import getProjectedUsage from "~/lib/tenant-service/get-projected-usage";
import getTierLimit from "~/lib/tenant-service/get-tier-limit";
import rotateAuthToken, {
  TokenNotFound,
} from "~/lib/tenant-service/rotate-auth-token";
import upgradePricingPlan, {
  InvalidPriceError,
  MustUpgradeError,
  PaymentMethodExpiredError,
  PaymentMethodRequiredError,
} from "~/lib/tenant-service/upgrade-pricing-plan";
import { validateNewOwnerIdP } from "~/lib/tenant-service/validate-new-owner-idp";
import {
  ITenant,
  IUpdatePaymentMethodRequest,
  TenantDiscoverability,
} from "~/types.api";
import requireCapabilityMiddleware from "./middleware/require-capability";

interface IChangeOwnerRequest {
  ownerId: string;
}

interface IRotateAuthTokenRequest {
  token: string;
}

const tenants = new KoaRouter();

tenants.post(
  "/:id/change-owner",
  requireCapabilityMiddleware("user:WriteItem"),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const tenant = context.tenantContext;

    const { ownerId } = assertBody(context) as IChangeOwnerRequest;
    const { domains, requireSso } = tenant;

    const newOwner = await getUser(ownerId);

    // ensure ownerId is a valid user
    if (!newOwner || !newOwner.id) {
      throw new BadRequest("New ownerId is invalid.");
    }

    if (!!requireSso && domains.length) {
      validateNewOwnerIdP({ requireSso, domains, newOwner });
    }

    await put({
      Item: {
        ...tenant,
        owner: ownerId,
      },
      TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
    });

    await sendTrackEvent({
      body: { ownerId },
      key: "tenant-ownership-transferred",
      tenantId,
      userId,
    });

    context.status = 204;
  }
);

tenants.post(
  "/:id/token",
  requireCapabilityMiddleware("apikey:RotateKey"),
  async (context) => {
    const { email, tenantId, userId } = context.userContext;
    const { token } = assertBody<IRotateAuthTokenRequest>(context);

    try {
      const newAuthToken = await rotateAuthToken(
        {
          email,
          id: userId,
        },
        tenantId,
        token
      );

      context.body = {
        token: newAuthToken,
      };
    } catch (err) {
      if (err instanceof TokenNotFound) {
        throw new BadRequest(err.message);
      }

      throw err;
    }
  }
);

tenants.put(
  "/:id/payment-method",
  requireCapabilityMiddleware("billing:UpdatePaymentMethod"),
  async (ctx) => {
    const { tenantId } = ctx.userContext;
    const body = assertBody(ctx) as IUpdatePaymentMethodRequest;

    const tenant = ctx.tenantContext;

    if (!tenant.stripeCustomerId) {
      throw new BadRequest("Tenant must be configured in stripe");
    }

    if (tenant.stripePaymentMethod && tenant.stripePaymentMethod.id) {
      log(
        `Detaching payment method from ${tenantId}/${tenant.stripeCustomerId}`
      );
      await stripe.paymentMethods.detach(tenant.stripePaymentMethod.id);
    }

    const response = await stripe.paymentMethods.attach(body.id, {
      customer: tenant.stripeCustomerId,
    });

    log(`Payment method attached to customer`, response);
    ctx.status = 204;
  }
);

tenants.post(
  "/:id/domains",
  requireCapabilityMiddleware("security:WriteSettings"),
  async (context) => {
    const { discoverable, domains, requireSso } = assertBody(context) as {
      discoverable: TenantDiscoverability;
      domains: string[];
      requireSso: string;
    };
    const tenant = context.tenantContext;
    const { tenantId, userId } = context.userContext;

    if (tenant.googleSsoDomain) {
      delete tenant.googleSsoDomain;
    }

    const domainsToRemove = tenant.domains.filter(
      (oldDomain) => !domains.includes(oldDomain)
    );
    const domainsToAdd = domains.filter(
      (newDomain) => !tenant.domains.includes(newDomain)
    );

    if (domainsToRemove.length) {
      domainsToRemove.map((oldDomain) =>
        removeTenantFromDomain(oldDomain, tenantId)
      );
    }

    if (domainsToAdd.length) {
      domainsToAdd.map((newDomain) => addTenantToDomain(newDomain, tenantId));
    }

    const newTenant = {
      ...tenant,
      discoverable,
      domains,
      requireSso,
    };

    await put({
      Item: newTenant,
      TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
    });

    // Audit Workspace Security changes
    if (tenant.requireSso !== requireSso) {
      let userObj: { id: string; email: string };

      try {
        const user = await getUser(userId);
        userObj = { id: userId, email: user.email };
      } catch (err) {
        userObj = { id: userId, email: "" };
      }

      requireSso
        ? await emitWorkspaceSecuritySSOEnabledEvent(
            "published/production",
            new Date(),
            userObj,
            tenantId
          )
        : await emitWorkspaceSecuritySSODisabledEvent(
            "published/production",
            new Date(),
            userObj,
            tenantId
          );
    }

    // Audit Workspace Discoverability/Accessibility changes
    if (tenant.discoverable !== discoverable) {
      let userObj: { id: string; email: string };

      try {
        const user = await getUser(userId);
        userObj = { id: userId, email: user.email };
      } catch (err) {
        userObj = { id: userId, email: "" };
      }

      if (discoverable === "RESTRICTED") {
        await emitWorkspaceDiscoverabilityDisabledEvent(
          "published/production",
          new Date(),
          userObj,
          tenantId
        );
      } else if (tenant.discoverable === "RESTRICTED") {
        await emitWorkspaceDiscoverabilityEnabledEvent(
          "published/production",
          new Date(),
          userObj,
          tenantId
        );
      } else {
        await emitWorkspaceAccessibilityChangedEvent(
          "published/production",
          new Date(),
          userObj,
          tenantId
        );
      }
    }

    context.body = newTenant;
  }
);

tenants.post(
  "/:id/apply-promo/:code",
  requireCapabilityMiddleware("billing:UpdatePlan"),
  async (context) => {
    const { tenantId } = context.userContext;
    const code = assertPathParam(context, "code");

    try {
      await applyPromotionCode(tenantId, code);
      context.status = 204;
    } catch (err) {
      if (err instanceof InvalidPromoCodeError) {
        throw new BadRequest("Invalid Promo Code");
      }
      throw err;
    }
  }
);

tenants.get(
  "/:id/current-plan",
  requireCapabilityMiddleware("billing:ViewBilling"),
  async (context) => {
    const { stripeSubscriptionItemId } = context.tenantContext;

    const subscriptionItem = await stripe.subscriptionItems.retrieve(
      stripeSubscriptionItemId
    );

    const subscription = await stripe.subscriptions.retrieve(
      subscriptionItem.subscription
    );

    const promoCode = subscription?.discount?.promotion_code
      ? await stripe.promotionCodes.retrieve(
          subscription.discount.promotion_code as string
        )
      : undefined;

    context.body = {
      plan: findPricingPlan(subscriptionItem?.price?.id),
      promoCode: promoCode?.code,
    };
  }
);

tenants.post(
  "/:id/upgrade",
  requireCapabilityMiddleware("billing:UpdatePlan"),
  async (context) => {
    const { tenantId } = context.userContext;
    const body = assertBody<{ plan: PricingPlan }>(context);

    if (!body.plan) {
      throw new BadRequest("plan required");
    }

    try {
      await upgradePricingPlan(tenantId, body.plan);
    } catch (err) {
      if (err instanceof InvalidPriceError) {
        throw new BadRequest(`Invalid price selection: ${body.plan}`);
      }
      if (err instanceof MustUpgradeError) {
        throw new BadRequest("Cannot downgrade plans.");
      }
      if (err instanceof PaymentMethodExpiredError) {
        throw new PaymentRequired("Payment method expired");
      }
      if (err instanceof PaymentMethodRequiredError) {
        throw new PaymentRequired("Must have payment method on file");
      }
      throw err;
    }

    context.status = 204;
  }
);

tenants.get("/:id/usage", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const tenant = ctx.tenantContext;

  // fall back to start and end of month if stripe information is not available
  // this should _really_ only happen in environments that are not connected
  // to stripe (eg: development). though, due to the asynchronous nature
  // of the connection to stripe, it is _possible_ that a tenant/user
  // might hit this page before all data has been created.
  const currentPeriodEnd =
    tenant.stripeCurrentPeriodEnd || endOfMonth(Date.now()).getTime();
  const currentPeriodStart =
    tenant.stripeCurrentPeriodStart || startOfMonth(Date.now()).getTime();

  // ensure the number is never below zero
  const currentPeriodDaysTilEnd = Math.max(
    differenceInCalendarDays(currentPeriodEnd, Date.now()),
    0
  );

  const {
    stripeLastInvoiceUsage: lastPeriodUsage,
    stripeSubscriptionTiers: tiers,
  } = tenant;

  const days = eachDayOfInterval({
    end: currentPeriodEnd,
    start: currentPeriodStart,
  });

  const keys = days.reduce((acc, date) => {
    return [
      ...acc,
      {
        day: format(date, "yyyy-MM-dd"),
        tenantId,
      },
      {
        day: format(date, "yyyy-MM-dd"),
        tenantId: `${tenantId}/test`,
      },
    ];
  }, []);

  const entries = await getUsageForInterval(...keys);

  const currentPeriodUsage = entries.reduce((acc, entry) => {
    if (!entry.metrics.sent) {
      return acc;
    }
    return acc + entry.metrics.sent;
  }, 0);

  const currentPeriodProjectedUsage = getProjectedUsage(
    currentPeriodStart,
    currentPeriodEnd,
    currentPeriodUsage
  );

  const currentPeriodTier =
    getTierLimit(tiers, currentPeriodUsage, lastPeriodUsage) || 100000;

  ctx.body = {
    currentPeriodDaysTilEnd,
    currentPeriodEnd,
    currentPeriodProjectedUsage,
    currentPeriodStart,
    currentPeriodTier,
    currentPeriodUsage,
    lastPeriodUsage,
  };
});

tenants.post(
  "/customer-portal-session",
  requireCapabilityMiddleware("billing:UpdatePaymentMethod"),
  requireCapabilityMiddleware("billing:UpdatePlan"),
  requireCapabilityMiddleware("billing:ViewBilling"),
  async (ctx) => {
    const tenant: ITenant = ctx.tenantContext;

    if (!tenant.stripeCustomerId) {
      throw new BadRequest("Tenant must be configured in stripe");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: getEnvVar("APP_URL"),
    });

    ctx.body = {
      customer_portal_session_url: session.url,
    };
  }
);

export default tenants;
