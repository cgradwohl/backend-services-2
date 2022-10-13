import { get as getCustomer } from "~/lib/customer-tenant-lookup-service";
import { warn } from "~/lib/log";
import client, { Stripe } from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import eventHandler from "./event-handler";

const fetchCustomer = async (
  paymentMethod: Stripe.PaymentMethod,
  event: Stripe.Event
) => {
  const customerId =
    event.type === "payment_method.detached"
      ? (event.data.previous_attributes as any).customer
      : (paymentMethod.customer as string);

  const customer = await getCustomer({ customerId });

  if (!customer) {
    warn(`${customerId} not found`);
  }

  return customer;
};

export const paymentMethodHandler = eventHandler<Stripe.PaymentMethod>(
  async (paymentMethod, event) => {
    const customer = await fetchCustomer(paymentMethod, event);

    if (!customer) {
      return;
    }

    const { tenantId } = customer;

    if (event.type === "payment_method.detached") {
      await updateTenant({ tenantId }, { stripePaymentMethod: null });
      return;
    }

    // https://stripe.com/docs/api/payment_methods/attach
    if (event.type === "payment_method.attached") {
      // https://stripe.com/docs/api/customers/update#update_customer-invoice_settings-default_payment_method
      await client.customers.update(customer.customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
    }

    const { card } = paymentMethod;
    await updateTenant(
      { tenantId },
      {
        stripePaymentMethod: {
          card: {
            brand: card.brand,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            last4: card.last4,
          },
          id: paymentMethod.id,
        },
      }
    );
  }
);
