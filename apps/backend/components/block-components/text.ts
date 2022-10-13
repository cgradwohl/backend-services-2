import serializeHtml from "../../lib/serialize-html";
import serializeMd from "../../lib/serialize-md";
import serializePlain from "../../lib/serialize-plain";
import getTextStyle from "../lib/text-styles";

import { ITextBlockConfig } from "../../types.api";
import { IBlockRenderer, ISlackBlock } from "../../types.internal";

const textRenderer: IBlockRenderer = (block, serializerType) => {
  const { scope: variables, config: blockConfig, links: linkHandler } = block;
  const { align, textStyle, value } = blockConfig as ITextBlockConfig;
  let backgroundColor = variables.replace(blockConfig.backgroundColor);

  if (backgroundColor.includes("{brand.colors")) {
    backgroundColor = "transparent";
  }

  if (serializerType === "slack") {
    if (textStyle === "h1") {
      const text = serializePlain(value, linkHandler, variables.replace);

      if (!text) {
        return;
      }

      return {
        text: {
          text,
          type: "plain_text",
        },
        type: "header",
      };
    }

    const text = serializeMd(value, linkHandler, variables.replace, "slack");
    if (!text) {
      return;
    }

    const slackBlock: ISlackBlock = {
      text: {
        text,
        type: "mrkdwn",
      },
      type: "section",
    };

    return slackBlock;
  }

  if (serializerType === "md") {
    return serializeMd(value, linkHandler, variables.replace);
  }

  if (serializerType === "plain") {
    return serializePlain(value, linkHandler, variables.replace);
  }

  const isTransparent = !backgroundColor || backgroundColor === "transparent";

  return `
    <mj-section css-class="c--block c--block-text">
      <mj-column background-color="${
        backgroundColor || "transparent"
      }" padding="${isTransparent ? "4px 0px" : "4px 20px"}">
        <mj-text ${getTextStyle(textStyle)} align="${
    align || "left"
  }" css-class="c--text-${textStyle || "text"}">
            ${serializeHtml(value, linkHandler, variables.replace)}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
};

export default textRenderer;
