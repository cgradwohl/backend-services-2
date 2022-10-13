import makeError from "make-error";

import stripe, { Stripe } from "~/lib/stripe";
import { get as getTenant } from "./";

export const InvalidPromoCodeError = makeError("InvalidPromoCodeError");

function assertPromoCode(
  promoCode: Stripe.PromotionCode
): asserts promoCode is NonNullable<Stripe.PromotionCode> {
  if (promoCode === null || promoCode === undefined) {
    throw new InvalidPromoCodeError();
  }
}

function assertPromoCodeActive(promoCode: Stripe.PromotionCode) {
  if (promoCode?.active !== true) {
    throw new InvalidPromoCodeError();
  }

  if (promoCode?.coupon?.valid !== true) {
    throw new InvalidPromoCodeError();
  }
}

export default async (tenantId: string, code: string) => {
  const promoCodes = await stripe.promotionCodes.list({ code });
  const promoCode = promoCodes.data[0];

  assertPromoCode(promoCode);
  assertPromoCodeActive(promoCode);

  const { stripeSubscriptionItemId } = await getTenant(tenantId);

  const subscriptionItem = await stripe.subscriptionItems.retrieve(
    stripeSubscriptionItemId
  );

  const { subscription } = subscriptionItem;

  await stripe.subscriptions.update(subscription, {
    promotion_code: promoCode.id,
  });
};
