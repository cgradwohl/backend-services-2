import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IActionBlockConfig } from "~/types.api";
import { ISlackBlock } from "~/types.internal";

const actionRendererSlackLink = (
  config: IActionBlockConfig,
  block: ISerializableBlock
): ISlackBlock => {
  const { links, scope } = block;

  const text = scope.replace(config.text);
  const href = links.getHref("action", scope.replace(config.href));

  return {
    text: {
      text: `<${href}|${text}>`,
      type: "mrkdwn",
    },
    type: "section",
  };
};

const actionRendererSlackButton = (
  config: IActionBlockConfig,
  block: ISerializableBlock
): ISlackBlock => {
  const { links, scope } = block;

  const trackingId = config.useWebhook && links.getTrackingId("action");
  const actionId = trackingId || scope.replace(config.actionId);
  const text = scope.replace(config.text);

  const href =
    !config.useWebhook && links.getHref("action", scope.replace(config.href));

  return {
    elements: [
      {
        action_id: actionId || undefined,
        text: {
          emoji: true,
          text,
          type: "plain_text",
        },
        type: "button",
        url: href || undefined,
      },
    ],
    type: "actions",
  };
};

const actionRendererSlack = (
  config: IActionBlockConfig,
  block: ISerializableBlock
): ISlackBlock => {
  const { style } = config;

  switch (style) {
    case "link":
      return actionRendererSlackLink(config, block);
    case "button":
      return actionRendererSlackButton(config, block);
    default:
      const exhaustiveCheck: never = style;
      throw new Error(`Unexpected style [${exhaustiveCheck}]`);
  }
};

export default actionRendererSlack;
