import generateSlateDocument from "~/lib/blocks/generate-slate-document";
import htmlToSlate from "~/lib/blocks/html-to-slate";
import {
  CourierObject,
  INotificationJsonWire,
  ITemplateLocales,
} from "~/types.api";
import { IApiNotificationPostLocalesRequest } from "~/types.public";

export const transformRequest = (
  template: CourierObject<INotificationJsonWire>,
  blocks: IApiNotificationPostLocalesRequest["blocks"],
  channels: IApiNotificationPostLocalesRequest["channels"]
) => {
  const locales: ITemplateLocales = {};

  for (const block of template?.json?.blocks) {
    const incomingLocaleBlock = blocks?.find((incomingBlock) => {
      return (
        incomingBlock.id === `block_${block.id}` &&
        block.type === incomingBlock.type
      );
    });

    if (!incomingLocaleBlock) {
      continue;
    }

    const blockConfig = JSON.parse(block.config);

    switch (incomingLocaleBlock.type) {
      case "quote":
      case "markdown":
      case "text": {
        const sourceSlateValue = generateSlateDocument(blockConfig.value);

        for (const locale of Object.keys(incomingLocaleBlock?.locales ?? {})) {
          locales[locale] = locales?.[locale] ?? {
            blocks: [],
            channels: [],
          };

          const localeBlock = incomingLocaleBlock?.locales?.[locale] as string;

          const localeSlateContent = generateSlateDocument(
            htmlToSlate(localeBlock, sourceSlateValue) as object
          );

          locales[locale].blocks.push({
            content: localeSlateContent.toJSON(),
            id: block.id,
            type: block.type,
          });
        }
        break;
      }
      case "action": {
        for (const locale of Object.keys(incomingLocaleBlock?.locales ?? {})) {
          locales[locale] = locales?.[locale] ?? {
            blocks: [],
            channels: [],
          };

          const localeBlock = incomingLocaleBlock?.locales?.[locale] as string;

          locales[locale].blocks.push({
            content: localeBlock,
            id: block.id,
            type: block.type,
          });
        }
        break;
      }
      case "template": {
        const style = blockConfig.template.match(
          /<style>(.|\n)*?<\/style>/g
        )?.[0];

        for (const locale of Object.keys(incomingLocaleBlock?.locales ?? {})) {
          locales[locale] = locales?.[locale] ?? {
            blocks: [],
            channels: [],
          };

          const localeBlock = incomingLocaleBlock?.locales?.[locale] as string;
          const content = style ? style + "\n" + localeBlock : localeBlock;

          locales[locale].blocks.push({
            content,
            id: block.id,
            type: block.type,
          });
        }
        break;
      }
      case "list": {
        const sourceChildSlateValue = generateSlateDocument(
          blockConfig.child?.value
        );

        const sourceTopSlateValue = generateSlateDocument(
          blockConfig.top?.value
        );

        for (const locale of Object.keys(incomingLocaleBlock?.locales ?? {})) {
          locales[locale] = locales?.[locale] ?? {
            blocks: [],
            channels: [],
          };

          const localeBlock = incomingLocaleBlock?.locales?.[locale] as {
            parent: string;
            children: string;
          };

          const localeChildSlateContent = generateSlateDocument(
            htmlToSlate(localeBlock.children, sourceChildSlateValue) as object
          );

          const localeTopSlateContent = generateSlateDocument(
            htmlToSlate(localeBlock.parent, sourceTopSlateValue) as object
          );

          locales[locale].blocks.push({
            content: {
              children: localeChildSlateContent.toJSON(),
              parent: localeTopSlateContent.toJSON(),
            },
            id: block.id,
            type: block.type,
          });
        }
        break;
      }
    }
  }

  const allChannels = [
    ...template?.json?.channels?.bestOf,
    ...template?.json?.channels?.always,
  ];

  for (const channel of allChannels) {
    const incomingLocaleChannel = channels?.find((incomingChannel) => {
      return incomingChannel.id === `channel_${channel.id}`;
    });

    if (!incomingLocaleChannel) {
      continue;
    }

    for (const locale of Object.keys(incomingLocaleChannel?.locales ?? {})) {
      locales[locale] = locales?.[locale] ?? {
        blocks: [],
        channels: [],
      };

      const localeChannel = incomingLocaleChannel?.locales?.[locale] as {
        subject?: string;
        title?: string;
      };

      locales[locale].channels.push({
        content: {
          subject: localeChannel.subject,
          title: localeChannel.title,
        },
        id: channel.id,
      });
    }
  }

  return locales;
};
