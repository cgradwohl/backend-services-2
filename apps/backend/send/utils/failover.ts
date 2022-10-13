import { PricingPlan } from "~/lib/plan-pricing";
import { RouteNodeAddress, SendTimes } from "~/lib/send-routing";
import { actionService } from "../service";
import { IRouteAction } from "../types";

export interface FailoverOpts {
  address?: RouteNodeAddress;
  times?: SendTimes;
  dryRunKey?: string;
  messageFilePath: string;
  messageId: string;
  requestId: string; // This feels redundant cause of messageId but IRouteAction requires it
  contextFilePath: string;
  tenantId: string;
  pricingPlan?: PricingPlan;
}

/**
 * In the event that a provider fails and has exhausted all retries within timeout bounds,
 * call this function to re-trigger route and potentially failover to a new provider and or
 * channel
 *
 * Requires Business (custom) tier subscription plan. Note: It is possible an error can prevent
 * us from getting the payment plan for the current tenant. In this scenario we assume they
 * are business tier.
 */
export const failover = (opts: FailoverOpts) => {
  if (opts.pricingPlan && opts.pricingPlan !== "custom") return;
  if (!opts.address || !opts.times) return;

  return actionService(opts.tenantId).emit<IRouteAction>({
    command: "route",
    dryRunKey: opts.dryRunKey,
    contextFilePath: opts.contextFilePath,
    messageId: opts.messageId,
    messageFilePath: opts.messageFilePath,
    requestId: opts.requestId,
    tenantId: opts.tenantId,
    failedAddress: opts.address,
    times: opts.times,
  });
};
