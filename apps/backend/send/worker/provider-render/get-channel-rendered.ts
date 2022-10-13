import isNotificationWire from "~/send/utils/is-notification-wire";
import { IChannel, IChannelProvider } from "~/types.api";
import { ISendMessageContext } from "../../types";

export function getChannelRendered(
  context: ISendMessageContext,
  channelId: string,
  providerId: string
): { channelRendered?: IChannel; providerRendered?: IChannelProvider } {
  const { content } = context;

  if (!isNotificationWire(content)) {
    return {};
  }

  const channelRendered = [
    ...(content?.json?.channels?.always ?? []),
    ...(content?.json?.channels?.bestOf ?? []),
  ].find((channel) => channel.id === channelId);

  if (!channelRendered) {
    return {};
  }

  const providerRendered = channelRendered.providers.find(
    (provider) => provider.configurationId === providerId
  );

  return { channelRendered, providerRendered };
}
