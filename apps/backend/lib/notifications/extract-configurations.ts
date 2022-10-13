import uniq from "uniq";
import { IChannel, INotificationWire } from "~/types.api";

const reduceChannelProviders = (
  acc: Array<string>,
  channel: IChannel
): Array<string> => {
  const providers = channel.providers
    .filter((channelProvider) => channelProvider.configurationId)
    .map((channelProvider) => channelProvider.configurationId);
  return [...acc, ...providers];
};

export default function getConfigurations(
  notification: INotificationWire
): Array<string> {
  const { channels } = notification.json;

  const always = channels.always.reduce(reduceChannelProviders, []);
  const bestOf = channels.bestOf.reduce(reduceChannelProviders, []);

  return uniq([...always, ...bestOf]);
}
