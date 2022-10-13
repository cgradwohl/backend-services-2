import makeError from "make-error";
import courierClient from "~/lib/courier";

import stripe from "~/lib/stripe";
import { ITenant } from "~/types.api";
import { get as getTenant } from ".";
import { Price, prices, PricingPlan } from "../plan-pricing";

const progression: Price[] = [prices.good, prices.better];
const UPGRADE_AUTOMATION_TEMPLATE_ALIAS = "usage-grace-period-plan-upgraded";

export const InvalidPriceError = makeError("InvalidPriceError");
export const MustUpgradeError = makeError("MustUpgradeError");
export const NoSubscriptionFoundError = makeError("NoSubscriptionFoundError");
export const PaymentMethodExpiredError = makeError("PaymentMethodExpiredError");
export const PaymentMethodRequiredError = makeError(
  "PaymentMethodRequiredError"
);

function assertValidPricingPlan(
  pricingPlan: PricingPlan
): asserts pricingPlan is PricingPlan {
  if (Object.keys(prices).includes(pricingPlan)) {
    return;
  }

  throw new InvalidPriceError();
}

function assertIsUpgrade(current: Price, proposed: Price) {
  if (progression.indexOf(proposed) <= progression.indexOf(current)) {
    throw new MustUpgradeError();
  }
}

function assertPaymentMethod(
  stripePaymentMethod: ITenant["stripePaymentMethod"]
) {
  if (!stripePaymentMethod) {
    throw new PaymentMethodRequiredError();
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expMonth = stripePaymentMethod.card?.exp_month;
  const expYear = stripePaymentMethod.card?.exp_year;

  const expired =
    expYear < currentYear ||
    (expYear === currentYear && currentMonth > expMonth);

  if (expired) {
    throw new PaymentMethodExpiredError();
  }
}

function assertSubscriptionItemId(
  id: string
): asserts id is NonNullable<string> {
  if (id && id.trim().length) {
    return;
  }
  throw new NoSubscriptionFoundError();
}

export default async (tenantId: string, pricingPlan: PricingPlan) => {
  assertValidPricingPlan(pricingPlan);

  const price = prices[pricingPlan];
  const {
    stripeSubscriptionItemId,
    stripePaymentMethod,
    isOverSendLimit,
    isInGracePeriod,
  } = await getTenant(tenantId);

  assertSubscriptionItemId(stripeSubscriptionItemId);
  assertPaymentMethod(stripePaymentMethod);

  const subscriptionItem = await stripe.subscriptionItems.retrieve(
    stripeSubscriptionItemId
  );
  const { subscription } = subscriptionItem;

  assertIsUpgrade(subscriptionItem.price.id, price);

  // Cancel the grace period automation (if it exists)
  if (isOverSendLimit && isInGracePeriod) {
    await courierClient().automations.invokeAutomationTemplate({
      data: {
        cancellation_token: `${tenantId}/grace-period-automation`,
        plan: pricingPlan,
        workspace_id: `tenant.${tenantId}`,
      },
      templateId: UPGRADE_AUTOMATION_TEMPLATE_ALIAS,
    });
  }
  await stripe.subscriptions.update(subscription, {
    cancel_at_period_end: false,
    items: [
      {
        id: subscriptionItem.id,
        price,
      },
    ],
    proration_behavior: "none",
  });
};
