import { Stripe } from "~/lib/stripe";

type EventHandler<T> = (data: T, event: Stripe.Event) => Promise<void>;
type EventHandlerResponse = (event: Stripe.Event) => Promise<void>;

const eventHandler = <T>(handler: EventHandler<T>): EventHandlerResponse => {
  return async event => {
    const object = event.data.object as T;
    await handler(object, event);
  };
};

export default eventHandler;
