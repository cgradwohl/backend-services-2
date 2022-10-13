import {
  ElementalActionNode,
  ElementalCommentNode,
  ElementalMetaNode,
  ElementalNode,
  ElementalTextNode,
} from "~/api/send/types";
import {
  BlockWire,
  CourierObject,
  IActionBlockConfig,
  IChannel,
  INotificationJsonWire,
  ITextBlockConfig,
} from "~/types.api";
import slateToElemental from "../slate/slate-to-md-elemental-content";

type ExportElementalFn = ({
  notification,
}: {
  notification: CourierObject<INotificationJsonWire>;
}) => ElementalNode[];

const blockToNode = (block: BlockWire): ElementalNode => {
  switch (block.type) {
    case "text": {
      try {
        const { value } = JSON.parse(block.config) as ITextBlockConfig;
        return {
          content: slateToElemental(value),
          type: "text",
        } as ElementalTextNode;
        // TODO support locales
      } catch (ex) {
        // TODO handle failures
      }
      break;
    }
    case "action": {
      try {
        const blockConfig = JSON.parse(block.config) as IActionBlockConfig;
        return {
          action_id: blockConfig.actionId,
          align: blockConfig.align,
          background_color: blockConfig.backgroundColor,
          content: blockConfig.text,
          href: blockConfig.href,
          locales: blockConfig.locales,
          style: blockConfig.style,
          type: "action",
        } as ElementalActionNode;
        // TODO support locales
      } catch (ex) {
        // TODO handle failures
      }
      break;
    }
    default: {
      return {
        comment: "This block is not yet supported by Elemental export.",
        object: [
          {
            block_id: block.id,
            block_type: block.type,
          },
        ],
        type: "comment",
      } as ElementalCommentNode;
    }
  }
};

const channelToNode = (channel: IChannel): ElementalNode => {
  // TODO support locales
  if (channel.config?.email?.emailSubject) {
    return {
      title: channel.config?.email?.emailSubject,
      type: "meta",
    } as ElementalMetaNode;
  }
  if (channel.config?.push?.title) {
    return {
      title: channel.config?.push?.title,
      type: "meta",
    } as ElementalMetaNode;
  }
};

export const exportElemental: ExportElementalFn = ({ notification }) => {
  const channelIds: Set<string> = new Set<string>();

  return [
    ...notification?.json?.blocks?.map(blockToNode),
    ...notification?.json?.channels?.always?.map((channel) => {
      if (!channelIds.has(channel.id)) {
        channelIds.add(channel.id);
        return channelToNode(channel);
      }
    }),
    ...notification?.json?.channels?.bestOf?.map((channel) => {
      if (!channelIds.has(channel.id)) {
        channelIds.add(channel.id);
        return channelToNode(channel);
      }
    }),
  ].filter(Boolean);
};
