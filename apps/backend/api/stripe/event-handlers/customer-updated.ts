import { update as updateCustomer } from "~/lib/customer-tenant-lookup-service";
import * as transaction from "~/lib/dynamo/transaction";
import { warn } from "~/lib/log";
import { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

export const customerUpdatedHandler = eventHandler<Stripe.Customer>(
  async customer => {
    const customerId = customer.id;
    const { tenantId } = customer.metadata;

    if (!tenantId) {
      warn(`${customerId} had no tenantId attached to metadata`);
      return;
    }

    await transaction.write(
      transaction.create(
        updateCustomer.asTransactionItem({ customerId }, { tenantId }),
        updateTenant.asTransactionItem(
          { tenantId },
          { name: customer.name, stripeCustomerId: customerId }
        )
      )
    );
  }
);
