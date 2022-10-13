import { get as getTenant } from "~/lib/tenant-service";
import { ITenant } from "~/types.api";

interface IPrices {
  better: string;
  good: string;
}

const livePrices: IPrices = {
  better: "price_1J0ADDC1P6cM0F5K2tOj5UJS",
  good: "price_1HWTkBC1P6cM0F5Krbx2Xs3W",
};

const testPrices: IPrices = {
  better: "price_1HV2DdC1P6cM0F5KRGocJ3Dl",
  good: "price_1HVlSeC1P6cM0F5KntjktDfN",
};

export const prices =
  process.env.STAGE === "production" ? livePrices : testPrices;

export type Prices = typeof prices;
export type PricingPlan = keyof Prices | "custom";
export type Price = Prices[keyof Prices];

export const findPricingPlan = (price: Price): PricingPlan => {
  if (!price) {
    return "good";
  }

  for (const key in prices) {
    if (key in prices) {
      const value = prices[key];
      if (value === price) {
        return key as PricingPlan;
      }

      // legacy price support
      if (price === "price_1HWTl1C1P6cM0F5K6pqyxuvx") {
        return "better";
      }
    }
  }

  return "custom";
};

export const findPricingPlanForTenant = (tenant: ITenant) =>
  findPricingPlan(tenant.stripeSubscriptionItemPriceId);

export const isCustomTierTenantId = async (
  tenantId: string
): Promise<boolean> => {
  const tenant = await getTenant(tenantId);
  // Tenant is archived
  if (!tenant) {
    return null;
  }
  return findPricingPlanForTenant(tenant) === "custom";
};
