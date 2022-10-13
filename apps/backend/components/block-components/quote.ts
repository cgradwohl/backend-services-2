import serializeHtml from "../../lib/serialize-html";
import serializeMd from "../../lib/serialize-md";
import serializePlain from "../../lib/serialize-plain";
import getTextStyle from "../lib/text-styles";

import { IQuoteBlockConfig } from "../../types.api";
import { IBlockRenderer, ISlackBlock } from "../../types.internal";

const quoteRenderer: IBlockRenderer = (block, serializerType) => {
  const { scope: variables, config: blockConfig, links: linkHandler } = block;
  const { align = "left", textStyle, value } = blockConfig as IQuoteBlockConfig;

  let borderColor = variables.replace(blockConfig.borderColor || "#CBD5E0");

  if (borderColor && borderColor.includes("{brand.colors")) {
    borderColor = "#CBD5E0";
  }

  if (serializerType === "slack") {
    const text = `> ${serializeMd(
      value,
      linkHandler,
      variables.replace,
      "slack"
    )}`;
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
    return `> ${serializeMd(value, linkHandler, variables.replace)}`;
  }

  if (serializerType === "plain") {
    return `"${serializePlain(value, linkHandler, variables.replace)}"`;
  }

  return `
    <mj-section css-class="c--block c--block-quote">
      <mj-column padding="4px 20px" border-left="2px solid ${
        align !== "center" ? borderColor : "transparent"
      }">
        <mj-text ${getTextStyle("quote")} align="${
    align || "left"
  }" css-class="c--text-quote">
            ${serializeHtml(value, linkHandler, variables.replace)}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
};

export default quoteRenderer;
