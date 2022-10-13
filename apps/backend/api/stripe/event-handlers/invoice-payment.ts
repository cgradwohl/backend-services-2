import { get as getCustomer } from "~/lib/customer-tenant-lookup-service";
import { warn } from "~/lib/log";
import stripe, { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

export const invoicePaymentHandler = eventHandler<Stripe.Invoice>(
  async invoice => {
    if (!invoice.subscription) {
      return;
    }

    const customerId = invoice.customer as string;
    const customer = await getCustomer({ customerId });

    if (!customer) {
      warn(`${customerId} not found`);
      return;
    }

    const { tenantId } = customer;
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    await updateTenant(
      { tenantId },
      {
        // convert unix time to javascript epoch
        stripeCurrentPeriodEnd: subscription.current_period_end * 1000,
        stripeCurrentPeriodStart: subscription.current_period_start * 1000,
        stripeSubscriptionStatus: subscription.status,
      }
    );
  }
);
