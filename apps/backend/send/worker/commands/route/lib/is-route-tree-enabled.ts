import { findPricingPlanForTenant } from "~/lib/plan-pricing";
import { ITenant } from "~/types.api";

export const isRouteTreeEnabled = (
  tenant: ITenant,
  shouldUseRouteTree?: boolean
) => {
  return findPricingPlanForTenant(tenant) === "custom" || shouldUseRouteTree;
};
