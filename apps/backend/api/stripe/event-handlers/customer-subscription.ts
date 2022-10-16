import dynamoStoreService from "~/lib/dynamo/store-service";
import eventHandler from "./event-handler";
import { get as getCustomer } from "~/lib/customer-tenant-lookup-service";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { ITenantDynamoObject } from "~/types.api";
import { ITenantKey } from "~/lib/tenant-service/types";
import { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import { warn } from "~/lib/log";
import courierClient from "~/lib/courier";
import { findPricingPlan } from "~/lib/plan-pricing";

const tableName = getTableName(TABLE_NAMES.TENANTS_TABLE_NAME);
const service = dynamoStoreService<ITenantDynamoObject, ITenantKey>(tableName);

const BILLING_ROLLOVER_GRACE_PERIOD_ALIAS = "usage-grace-period-billing-reset";

export const customerSubscriptionHandler = eventHandler<Stripe.Subscription>(
  async (subscription) => {
    let {
      current_period_end: incomingStripeCurrentPeriodEnd,
      current_period_start: incomingStripeCurrentPeriodStart,
      customer: incomingStripeCustomer,
      items: incomingStripeItems,
      // @ts-ignore: updated type definition ignores old api version data structures
      plan: incomingStripePlan,
      status: incomingStripeStatus,
    } = subscription;
    const [subscriptionItem] = incomingStripeItems.data;

    // convert unix time to javascript epoch
    incomingStripeCurrentPeriodEnd *= 1000;
    incomingStripeCurrentPeriodStart *= 1000;

    const customerId = incomingStripeCustomer as string;
    const customer = await getCustomer({ customerId });

    if (!customer) {
      warn(`${customerId} not found`);
      return;
    }

    const { tenantId } = customer;
    const { stripeCurrentPeriodStart, stripeCurrentPeriodEnd, gracePeriodEnd } =
      await service.get({ tenantId });

    let updateTenantPayload: Partial<ITenantDynamoObject> = {
      stripeCurrentPeriodEnd: incomingStripeCurrentPeriodEnd,
      stripeCurrentPeriodStart: incomingStripeCurrentPeriodStart,
      stripeSubscriptionItemId: subscriptionItem.id,
      stripeSubscriptionItemPriceId: subscriptionItem.price.id,
      stripeSubscriptionStatus: incomingStripeStatus,
      stripeSubscriptionTiers: incomingStripePlan?.tiers,
    };

    /**
     * When the initial (first) tenat's STRIPE subscription event is invoked, we are essentially entering them into the DB.
     * During the subsequent invocations (i.e monthly period updates), we would check if the user has used up their GracePeriod,
     * and if thats the case, we would invoke the usage-grace-period-billing-reset automation
     *
     * DAYS:            1...............15...............30...............45...............60
     * Current          Start                            End
     * Grace                    gps             gpe
     * Incoming                                          Start                             End
     */
    if (stripeCurrentPeriodStart !== incomingStripeCurrentPeriodStart) {
      // reset usageCurrentPeriod to 0, _ONLY_ when a new period starts
      updateTenantPayload.usageCurrentPeriod = 0;
      updateTenantPayload.sendLimitWarning = false;

      const incomingStripePricingPlan = findPricingPlan(
        subscriptionItem?.price?.id
      );
      //invoke usage-grace-period-billing-reset automation _ONLY_ if the grace period EXISTS in the CURRENT period
      if (
        gracePeriodEnd &&
        stripeCurrentPeriodStart <= gracePeriodEnd &&
        gracePeriodEnd <= stripeCurrentPeriodEnd &&
        incomingStripePricingPlan === "good"
      ) {
        await courierClient().automations.invokeAutomationTemplate({
          templateId: BILLING_ROLLOVER_GRACE_PERIOD_ALIAS,
          data: {
            workspace_id: `tenant.${tenantId}`,
            cancellation_token: `${tenantId}/grace-period-automation`,
          },
        });
      }
    }

    await updateTenant({ tenantId }, updateTenantPayload);
  }
);
