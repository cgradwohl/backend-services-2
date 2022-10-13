import { createSimulatedEvent } from "~/lib/dynamo/event-logs";
import { ISendProviderPayload } from "~/send/types";
import { IChannel } from "~/types.api";

export async function mockSend({
  payload,
  provider,
  providerConfigId,
  channel,
}: {
  payload: ISendProviderPayload;
  provider: string;
  providerConfigId: string;
  channel?: IChannel;
}): Promise<void> {
  const providerResponse = {
    "message-id": "null-routed: success",
  };

  await createSimulatedEvent(
    payload.tenantId,
    payload.messageId,
    provider,
    providerConfigId,
    providerResponse,
    {
      id: channel?.id,
      label: channel?.label,
      taxonomy: channel?.taxonomy,
    }
  );
}
