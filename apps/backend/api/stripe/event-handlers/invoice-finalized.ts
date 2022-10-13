import { get as getCustomer } from "~/lib/customer-tenant-lookup-service";
import { warn } from "~/lib/log";
import { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

export const invoiceFinalizedHandler = eventHandler<Stripe.Invoice>(
  async invoice => {
    const customerId = invoice.customer as string;

    const customer = await getCustomer({ customerId });

    if (!customer) {
      warn(`${customerId} not found`);
      return;
    }

    await updateTenant(
      { tenantId: customer.tenantId },
      { stripeLastInvoiceUsage: invoice.subtotal }
    );
  }
);
