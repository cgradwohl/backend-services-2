import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";
import LaunchDarkly from "launchdarkly-node-server-sdk";

import launchdarkly from "~/lib/launchdarkly";
import { error } from "~/lib/log";
import { findPricingPlan } from "~/lib/plan-pricing";
import stripe from "~/lib/stripe";
import { get as getTenant } from "~/lib/tenant-service";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;
type Next = () => Promise<void>;

const ready = launchdarkly.waitForInitialization();

export default async (context: Context, next: Next) => {
  const { email, userId, tenantId } = context.userContext;

  try {
    await ready;
  } catch (err) {
    error("Error initializing LaunchDarkly client", err);
  }

  context.launchdarkly = launchdarkly;
  context.variation = async (
    flag: string,
    defaultValue?: LaunchDarkly.LDFlagValue
  ) => {
    const tenant = await getTenant(tenantId);

    let subscriptionPriceId;
    try {
      const subscriptionItem = await stripe.subscriptionItems.retrieve(
        tenant.stripeSubscriptionItemId
      );
      subscriptionPriceId = subscriptionItem?.price?.id;
    } catch {
      // do nothing
    }

    const user = {
      custom: {
        pricingPlan: findPricingPlan(subscriptionPriceId) ?? "good",
        tenantCreated: tenant.created,
        tenantId,
        username: userId,
      },
      email,
      key: `${tenantId}::${userId}`,
    };

    return launchdarkly.variation(flag, user, defaultValue);
  };

  await next();
};
