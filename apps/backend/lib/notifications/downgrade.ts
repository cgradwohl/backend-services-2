import {
  ILegacyNotificationWire,
  INotificationWire,
  IChannel,
  IChannelProvider,
  EmailJsonParams,
  ExpoConfig,
  FacebookMessengerConfig,
} from "~/types.api";
import { TaxonomyChannel } from "~/providers/types";

function findChannelByTaxonomy(
  taxonomy: TaxonomyChannel,
  notification: INotificationWire
): IChannel {
  let found: IChannel;

  function matchesTaxonomy(channel: IChannel) {
    return channel.taxonomy.indexOf(taxonomy) > -1;
  }

  const { always, bestOf } = notification.json.channels;
  found = always.find(matchesTaxonomy);

  if (found) {
    return found;
  }

  return bestOf.find(matchesTaxonomy);
}

function findProvider(
  providerKey: string,
  notification: INotificationWire
): IChannelProvider {
  let found: IChannel;

  function hasConfig(channel: IChannel) {
    return channel.providers.some(provider => {
      const config = provider.config[providerKey] || {};
      return Object.keys(config).length > 0;
    });
  }

  const { always, bestOf } = notification.json.channels;
  found = always.find(hasConfig);

  if (found) {
    return found.providers[0];
  }

  found = bestOf.find(hasConfig);
  return found ? found.providers[0] : null;
}

function extractEmailConfig(notification: INotificationWire): EmailJsonParams {
  const channel = findChannelByTaxonomy("email", notification);

  if (!channel) {
    return undefined;
  }

  return channel.config.email;
}

function extractExpoConfig(notification: INotificationWire): ExpoConfig {
  const provider = findProvider("expo", notification);

  if (!provider) {
    return undefined;
  }

  return provider.config.expo;
}

function extractFacebookMessengerConfig(
  notification: INotificationWire
): FacebookMessengerConfig {
  const provider = findProvider("fbMessenger", notification);

  if (!provider) {
    return undefined;
  }

  return provider.config.fbMessenger;
}

type Providers = {
  [provider: string]: {
    [slot: string]: Array<string>;
  };
};
function extractProviders(notification: INotificationWire): Providers {
  const { always, bestOf } = notification.json.channels;
  let providers: Providers = {};

  function addProviderSlots(
    providers: Providers,
    channel: IChannel
  ): Providers {
    const provider = { body: channel.blockIds };
    const providerKey = channel.providers[0].key;
    return { ...providers, [providerKey]: provider };
  }

  providers = always.reduce(addProviderSlots, { ...providers });
  providers = bestOf.reduce(addProviderSlots, { ...providers });
  return providers;
}

export default function downgradeNotification(
  notification: INotificationWire
): ILegacyNotificationWire {
  const event: ILegacyNotificationWire = {
    ...notification,
    json: {
      blocks: notification.json.blocks,
      providers: extractProviders(notification),
      strategyId: notification.json.__legacy__strategy__id__,
      ...extractEmailConfig(notification),
    },
  };

  const expoConfig = extractExpoConfig(notification);
  if (expoConfig && Object.keys(expoConfig).length) {
    event.json.expoConfig = expoConfig;
  }

  const fbMessengerConfig = extractFacebookMessengerConfig(notification);
  if (fbMessengerConfig && Object.keys(fbMessengerConfig).length) {
    event.json.fbMessengerConfig = fbMessengerConfig;
  }

  return event;
}
