import { ValueJSON } from "slate";
import { createMd5Hash } from "~/lib/crypto-helpers";
import { BlockWire, IChannel, INotificationWire } from "~/types.api";
import {
  IApiNotificationBlock,
  IApiNotificationChannel,
  IApiTemplateLocales,
} from "~/types.public";
import fromSlate from "../../locales/transforms/from-slate";

type TransformResponseFn = (
  notification: INotificationWire
) => IApiTemplateLocales;

export const transformResponse: TransformResponseFn = (notification) => {
  if (!notification) {
    return null;
  }

  const mapWireBlocks = (wireBlock: BlockWire) => {
    const apiBlock: IApiNotificationBlock = {
      alias: wireBlock.alias,
      context: wireBlock.context,
      id: `block_${wireBlock.id}`,
      type: wireBlock.type,
    };

    switch (wireBlock.type) {
      case "quote":
      case "markdown":
      case "text": {
        try {
          const { value: mainSlateValue, locales } = JSON.parse(
            wireBlock.config
          ) as {
            value: ValueJSON;
            locales: {
              [locale: string]: ValueJSON;
            };
          };

          apiBlock.content = fromSlate(mainSlateValue);
          apiBlock.checksum = createMd5Hash(apiBlock.content);
          if (locales) {
            apiBlock.locales = Object.keys(locales).reduce((acc, locale) => {
              acc[locale] = fromSlate(locales?.[locale]);
              return acc;
            }, {});
          }
        } catch (ex) {
          // do nothing, return basic block
        }
        return apiBlock;
      }

      case "action": {
        try {
          const { text: content, locales } = JSON.parse(wireBlock.config) as {
            text: string;
            locales: {
              [locale: string]: string;
            };
          };

          apiBlock.content = content;
          apiBlock.checksum = createMd5Hash(apiBlock.content);

          if (locales) {
            apiBlock.locales = Object.keys(locales).reduce((acc, locale) => {
              acc[locale] = locales?.[locale];
              return acc;
            }, {});
          }
        } catch (ex) {
          // do nothing, return basic block
        }
        return apiBlock;
      }

      case "template": {
        try {
          const { template, locales } = JSON.parse(wireBlock.config) as {
            template: string;
            locales: {
              [locale: string]: string;
            };
          };

          apiBlock.content = template
            .replace(/<!--[\s\S]*?-->/g, "") // remove comment
            .replace(/(<style[\w\W]+style>)/g, ""); // remove style

          apiBlock.checksum = createMd5Hash(apiBlock.content);

          if (locales) {
            apiBlock.locales = Object.keys(locales).reduce((acc, locale) => {
              acc[locale] = locales?.[locale].replace(
                /(<style[\w\W]+style>)/g,
                ""
              ); // remove style;
              return acc;
            }, {});
          }
        } catch (ex) {
          // do nothing, return basic block
        }
        return apiBlock;
      }

      case "list": {
        try {
          const {
            top: { value: topSlateValue },
            child: { value: childSlateValue },
            locales,
          } = JSON.parse(wireBlock.config) as {
            top: {
              value: ValueJSON;
            };
            child: {
              value: ValueJSON;
            };
            locales: {
              [locale: string]: {
                children: ValueJSON;
                parent: ValueJSON;
              };
            };
          };

          apiBlock.content = {
            children: fromSlate(childSlateValue),
            parent: fromSlate(topSlateValue),
          };

          apiBlock.checksum = createMd5Hash(JSON.stringify(apiBlock.content));

          if (locales) {
            apiBlock.locales = Object.keys(locales).reduce((acc, locale) => {
              acc[locale] = {
                children: fromSlate(locales?.[locale]?.children),
                parent: fromSlate(locales?.[locale]?.parent),
              };
              return acc;
            }, {});
          }
        } catch (ex) {
          // do nothing, return basic block
        }
        return apiBlock;
      }

      default: {
        return apiBlock;
      }
    }
  };

  const mapChannel = (channel: IChannel) => {
    if (!channel.config?.email && !channel.config?.push) {
      return null;
    }

    const apiChannel: IApiNotificationChannel = {
      id: `channel_${channel.id}`,
    };

    try {
      const { email, push, locales } = channel.config;

      apiChannel.type = email ? "email" : "push";
      apiChannel.content = {
        subject: email?.emailSubject,
        title: push?.title,
      };

      apiChannel.checksum = createMd5Hash(JSON.stringify(apiChannel.content));

      if (locales) {
        apiChannel.locales = Object.keys(locales).reduce((acc, locale) => {
          acc[locale] = locales?.[locale];
          return acc;
        }, {});
      }
    } catch (ex) {
      // do nothing, return basic channel
    }
    return apiChannel;
  };

  const blocks = notification?.json?.blocks?.map(mapWireBlocks);
  const channels = [
    ...notification?.json?.channels?.always.map(mapChannel),
    ...notification?.json?.channels?.bestOf.map(mapChannel),
    ,
  ].filter(Boolean);

  return {
    blocks,
    channels,
    checksum: createMd5Hash(
      JSON.stringify({
        blocks: blocks.map((block) => block.content),
        channels: channels.map((channel) => channel.content),
      })
    ),
  };
};
