import { createDeliveredEvent } from "~/lib/dynamo/event-logs";
import { markSent } from "~/lib/dynamo/messages";
import providers from "~/providers";
import { UpdateMessageStatusFn } from "./types";

export const providerSent: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  const { channel, configuration, provider: providerKey, providerResponse } =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;

  await markSent(tenantId, messageId, providerKey, configuration);

  const provider = providers[providerKey];
  if (provider.deliveryStatusStrategy === "DELIVER_IMMEDIATELY") {
    await createDeliveredEvent(
      tenantId,
      messageId,
      providerKey,
      configuration,
      providerResponse,
      channel,
      provider?.getDeliveredTimestamp?.(providerResponse) ?? event.timestamp
    );
  }
};
