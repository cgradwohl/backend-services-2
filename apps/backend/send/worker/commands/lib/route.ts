import { MessageRouting } from "~/api/send/types";

export function assertIsValidRoutingChannel(
  channel: unknown
): asserts channel is string | MessageRouting {
  if (typeof channel === "string") {
    return;
  }

  if (!isRouting(channel)) {
    throw new Error(`Invalid channel: ${channel}`);
  }
}

export function isRouting(routing: unknown): routing is MessageRouting {
  return (
    typeof routing === "object" && "channels" in routing && "method" in routing
  );
}
