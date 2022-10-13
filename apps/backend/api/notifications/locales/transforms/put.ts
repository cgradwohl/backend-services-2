import generateSlateDocument from "~/lib/blocks/generate-slate-document";
import htmlToSlate from "~/lib/blocks/html-to-slate";
import {
  CourierObject,
  INotificationJsonWire,
  ITemplateLocaleBlock,
  ITemplateLocaleChannel,
  ITemplateLocales,
} from "~/types.api";
import { IApiNotificationPutLocaleRequest } from "~/types.public";

export const transformRequest = (
  template: CourierObject<INotificationJsonWire>,
  localeId: string,
  locales: ITemplateLocales,
  blocks: IApiNotificationPutLocaleRequest["blocks"],
  channels: IApiNotificationPutLocaleRequest["channels"]
) => {
  const locale: {
    blocks: ITemplateLocaleBlock[];
    channels: ITemplateLocaleChannel[];
  } = {
    blocks: [],
    channels: [],
  };

  for (const block of template?.json?.blocks) {
    const incomingLocaleBlock = blocks?.find((incomingBlock) => {
      return incomingBlock.id === `block_${block.id}`;
    });

    if (!incomingLocaleBlock) {
      continue;
    }

    const blockConfig = JSON.parse(block.config);

    switch (block.type) {
      case "quote":
      case "markdown":
      case "text": {
        const sourceSlateValue = generateSlateDocument(blockConfig.value);

        const localeBlock = incomingLocaleBlock.content as string;

        const localeSlateContent = generateSlateDocument(
          htmlToSlate(localeBlock, sourceSlateValue) as object
        );

        locale.blocks.push({
          content: localeSlateContent.toJSON(),
          id: block.id,
          type: block.type,
        });

        break;
      }
      case "action": {
        const localeBlock = incomingLocaleBlock.content as string;

        locale.blocks.push({
          content: localeBlock,
          id: block.id,
          type: block.type,
        });

        break;
      }
      case "template": {
        const style = blockConfig.template.match(
          /<style>(.|\n)*?<\/style>/g
        )?.[0];

        const localeBlock = incomingLocaleBlock.content as string;
        const content = style ? style + "\n" + localeBlock : localeBlock;

        locale.blocks.push({
          content,
          id: block.id,
          type: block.type,
        });

        break;
      }
      case "list": {
        const sourceChildSlateValue = generateSlateDocument(
          blockConfig.child?.value
        );

        const sourceTopSlateValue = generateSlateDocument(
          blockConfig.top?.value
        );

        const localeBlock = incomingLocaleBlock.content as {
          parent: string;
          children: string;
        };

        const localeChildSlateContent = generateSlateDocument(
          htmlToSlate(localeBlock.children, sourceChildSlateValue) as object
        );

        const localeTopSlateContent = generateSlateDocument(
          htmlToSlate(localeBlock.parent, sourceTopSlateValue) as object
        );

        locale.blocks.push({
          content: {
            children: localeChildSlateContent.toJSON(),
            parent: localeTopSlateContent.toJSON(),
          },
          id: block.id,
          type: block.type,
        });

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

    if (
      !incomingLocaleChannel ||
      (!channel.config?.email && !channel.config?.push)
    ) {
      // ignore if the channel is missing or isn't email or push
      continue;
    }

    const channelType = channel.config.email ? "email" : "push";

    const localeChannel = incomingLocaleChannel.content as string;

    locale.channels.push({
      content: {
        subject: channelType === "email" ? localeChannel : undefined,
        title: channelType === "push" ? localeChannel : undefined,
      },
      id: channel.id,
    });
  }

  locales[localeId] = {
    ...locale,
  };

  return locales;
};
