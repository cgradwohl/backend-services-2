import StripeClient, { Stripe } from "stripe";
import { RawRequestContext } from "./lambda-response";

const client = new StripeClient(process.env.STRIPE_SECRET_KEY, {
  apiVersion: null,
  maxNetworkRetries: 3,
  typescript: true,
});

export default client;

export function getWebhookEvent(context: RawRequestContext): Stripe.Event {
  const body = context.event.body;
  const signature =
    context.event.headers["Stripe-Signature"] ||
    context.event.headers["stripe-signature"];

  return client.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

export { Stripe };
