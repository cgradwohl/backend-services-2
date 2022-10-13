import jsonnetBlock from "./jsonnet-block.hbs";
import markdownBold from "../markdown/bold.hbs";
import markdownItalic from "../markdown/italic.hbs";

import notSupported from "../not-supported.hbs";
import plainLineReturn from "../plain/br.hbs";

import slackActionBlock from "./action-block.hbs";
import slackBulletList from "./bullet-list.hbs";
import slackDividerBlock from "./divider-block.hbs";
import slackImageBlock from "./image-block.hbs";
import slackLink from "./link.hbs";
import slackListBlock from "./list-block.hbs";
import slackListBlockChild from "./list-block-child.hbs";
import slackListBlockTop from "./list-block-top.hbs";
import slackListItem from "./list-item.hbs";
import slackMarkdownBlock from "./markdown-block.hbs";
import slackParagraph from "./paragraph.hbs";
import slackQuoteBlock from "./quote-block.hbs";
import slackStrikethrough from "./strikethrough.hbs";
import slackTextBlock from "./text-block.hbs";

const slackHandlebarsPartials = {
  "action-block": slackActionBlock,
  "bullet-list": slackBulletList,
  "divider-block": slackDividerBlock,
  "image-block": slackImageBlock,
  "inline-image": notSupported,
  "jsonnet-block": jsonnetBlock,
  "list-block-child": slackListBlockChild,
  "list-block-top": slackListBlockTop,
  "list-block": slackListBlock,
  "list-item": slackListItem,
  "markdown-block": slackMarkdownBlock,
  "paragraph-block": slackParagraph,
  "quote-block": slackQuoteBlock,
  "template-block": notSupported,
  "text-block": slackTextBlock,
  bold: markdownBold,
  br: plainLineReturn,
  italic: markdownItalic,
  link: slackLink,
  strikethrough: slackStrikethrough,
} as const;

export default slackHandlebarsPartials;
