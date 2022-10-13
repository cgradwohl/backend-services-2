import { IStripeSubscriptionTier } from "~/types.api";

type GetTierLimitFn = (
  tiers: IStripeSubscriptionTier[],
  currentPeriodUsage: number,
  lastPeriodUsage: number
) => number;

const getTierLimit: GetTierLimitFn = (
  tiers,
  currentPeriodUsage,
  lastPeriodUsage
) => {
  const max = (tiers || []).reduce((acc, tier) => Math.max(acc, tier.up_to), 0);

  return (tiers || []).reduceRight(
    (acc, tier) =>
      tier.up_to >= currentPeriodUsage && tier.up_to >= lastPeriodUsage
        ? tier.up_to
        : acc,
    max
  );
};

export default getTierLimit;
