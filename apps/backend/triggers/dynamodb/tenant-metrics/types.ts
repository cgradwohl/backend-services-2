import { PricingPlan } from "~/lib/plan-pricing";

import { ITenant } from "~/types.api";

export interface ITenantMetricsTraits extends ITenant {
  brand_count: number;
  brand_last_updated: Date | number;
  brand_last_created: Date | number;
  createdAt: Date | number;
  integration_count: number;
  integration_last_updated: Date | number;
  integration_last_created: Date | number;
  list_count: number;
  list_last_updated: Date | number;
  list_last_created: Date | number;
  notificationSendCount: number;
  notificationSendLastAt: Date | number;
  planCategory: PricingPlan;
  template_count: number;
  template_last_updated: Date | number;
  template_last_created: Date | number;
}
