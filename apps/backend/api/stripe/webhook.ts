import { BadRequest } from "~/lib/http-errors";
import { handleRaw } from "~/lib/lambda-response";
import log from "~/lib/log";
import { getWebhookEvent, Stripe } from "~/lib/stripe";
import { IStripeWebhookResponse } from "~/types.public";
import eventHandlers from "./event-handlers";

export const handle = handleRaw<IStripeWebhookResponse>(async (context) => {
  let event: Stripe.Event;

  try {
    event = getWebhookEvent(context);
  } catch (err) {
    throw new BadRequest(err.message);
  }

  const eventHandler = eventHandlers[event.type];
  if (eventHandler) {
    await eventHandler(event);
  } else {
    log(`no handler for event: ${event.type}`);
  }

  return {
    body: { received: true },
  };
});
