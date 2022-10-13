import extend from "deep-extend";
import { Message } from "~/api/send/types";
import { getSendRoutingStrategy } from "~/lib/send-routing";
import { RoutingStrategy } from "~/lib/send-routing/types";

/** Extends any routing strategy on the message with the default routing strategy */
export const extendRoutingStrategy = async (
  message: Message,
  tenantId: string
): Promise<RoutingStrategy> => {
  const strategy =
    "routing" in message
      ? { routing: message.routing, channels: {}, providers: {} }
      : await getSendRoutingStrategy({ tenantId });

  const channels = extend(strategy.channels, message?.channels ?? {});
  const providers = extend(strategy.providers, message?.providers ?? {});

  return {
    ...strategy,
    channels,
    providers,
  } as RoutingStrategy;
};
