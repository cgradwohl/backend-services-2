import { remove as removeCustomer } from "~/lib/customer-tenant-lookup-service";
import * as transaction from "~/lib/dynamo/transaction";
import { warn } from "~/lib/log";
import { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

export const customerDeletedHandler = eventHandler<Stripe.Customer>(
  async customer => {
    const customerId = customer.id;
    const { tenantId } = customer.metadata;

    if (!tenantId) {
      warn(`${customerId} had no tenantId attached to metadata`);
      return;
    }

    await transaction.write(
      transaction.create(
        removeCustomer.asTransactionItem({ customerId }),
        updateTenant.asTransactionItem(
          { tenantId },
          {
            stripeCurrentPeriodEnd: null,
            stripeCurrentPeriodStart: null,
            stripeCustomerId: null,
            stripeLastInvoiceUsage: null,
            stripePaymentMethod: null,
            stripeSubscriptionItemId: null,
            stripeSubscriptionStatus: null,
            stripeSubscriptionTiers: null,
          }
        )
      )
    );
  }
);
