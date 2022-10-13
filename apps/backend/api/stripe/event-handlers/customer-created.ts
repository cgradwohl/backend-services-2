import { update as updateCustomer } from "~/lib/customer-tenant-lookup-service";
import * as transaction from "~/lib/dynamo/transaction";
import { prices } from "~/lib/plan-pricing";
import stripe, { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

export const customerCreatedHandler = eventHandler<Stripe.Customer>(
  async (customer) => {
    const customerId = customer.id;
    const { tenantId } = customer.metadata;

    if (!tenantId) {
      return;
    }

    await transaction.write(
      transaction.create(
        updateCustomer.asTransactionItem(
          { customerId },
          { created: Date.now(), tenantId }
        ),
        updateTenant.asTransactionItem(
          { tenantId },
          {
            stripeCustomerId: customerId,
          }
        )
      )
    );

    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: prices.good }],
    });
  }
);
