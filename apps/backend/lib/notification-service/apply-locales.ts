import {
  BlockWire,
  IChannel,
  INotificationWire,
  ITemplateLocales,
} from "~/types.api";

type TransformResponseFn = ({
  notification,
  locales,
}: {
  notification: INotificationWire;
  locales: ITemplateLocales;
}) => INotificationWire;

export const applyLocales: TransformResponseFn = ({
  notification,
  locales,
}) => {
  if (!notification) {
    return null;
  }

  const applyBlockLocales = (wireBlock: BlockWire) => {
    try {
      const blockConfigJson = JSON.parse(wireBlock.config);

      blockConfigJson.locales = Object.keys(locales ?? {}).reduce(
        (acc, locale) => {
          const matchingBlock = locales?.[locale]?.blocks?.find(
            (b) => b.id === wireBlock.id && b.type === wireBlock.type
          );

          if (matchingBlock) {
            acc[locale] = matchingBlock.content;
          }

          return acc;
        },
        {}
      );

      return {
        ...wireBlock,
        config: JSON.stringify(blockConfigJson),
      };
    } catch (ex) {
      console.error("Error apply locales to block", ex);

      return wireBlock;
    }
  };

  const applyChannelLocales = (channel: IChannel) => {
    try {
      const channelConfig = channel.config ?? {};

      channelConfig.locales = Object.keys(locales ?? {}).reduce(
        (acc, locale) => {
          const matchingChannel = locales?.[locale]?.channels?.find(
            (c) => c.id === channel.id
          );

          if (matchingChannel) {
            acc[locale] = matchingChannel.content;
          }

          return acc;
        },
        {}
      );

      return {
        ...channel,
        config: channelConfig,
      };
    } catch (ex) {
      console.error("Error apply locales to channel", ex);

      return channel;
    }
  };

  return {
    ...notification,
    json: {
      ...notification.json,
      blocks: notification?.json?.blocks?.map(applyBlockLocales),
      channels: {
        always: notification?.json?.channels?.always?.map(applyChannelLocales),
        bestOf: notification?.json?.channels?.bestOf?.map(applyChannelLocales),
      },
    },
  };
};
