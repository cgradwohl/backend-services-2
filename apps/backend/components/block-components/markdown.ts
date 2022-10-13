import marked from "marked";
import sanitizeHtml from "sanitize-html";
import slackifyMarkdown from "slackify-markdown";
import juice from "juice";

import serializePlain from "../../lib/serialize-plain";
import getTextStyle from "../lib/text-styles";

import { IMarkdownBlockConfig } from "../../types.api";
import { IBlockRenderer, ISlackBlock } from "../../types.internal";

marked.setOptions({
  gfm: true,
});

// Defaults here: https://github.com/apostrophecms/sanitize-html#what-are-the-default-options
const ADDITIONAL_TAGS = ["h1", "h2", "img", "u"];

const markdownRenderer: IBlockRenderer = (block, serializerType) => {
  const { scope: variables, config: blockConfig, links: linkHandler } = block;
  const { value } = blockConfig as IMarkdownBlockConfig;

  if (serializerType === "slack") {
    const text = slackifyMarkdown(
      serializePlain(value, linkHandler, variables.replace, "slack")
    );
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

  // Markdown can stay as is so just reconstitue as plain
  if (serializerType === "md" || serializerType === "plain") {
    return serializePlain(value, linkHandler, variables.replace);
  }

  const html = marked(serializePlain(value, linkHandler, variables.replace));
  const allowedTags = sanitizeHtml.defaults.allowedTags.concat(ADDITIONAL_TAGS);
  const sanitizedJuicedHtml = juice(`
    <style>
      th {
        padding-right: 12px;
        text-align: left;
      }
      td {
        padding-right: 12px;
        padding-bottom: 12px;
      }
    </style>
    ${sanitizeHtml(html, { allowedTags })}
  `);

  return `
    <mj-section css-class="c--block c--block-markdown">
      <mj-column padding="4px 0px">
        <mj-text ${getTextStyle()} css-class="c--text-text">
            ${sanitizedJuicedHtml.trim()}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
};

export default markdownRenderer;
