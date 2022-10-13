import notSupported from "../not-supported.hbs";
import plainLineReturn from "../plain/br.hbs";
import markdownActionBlock from "./action-block.hbs";
import markdownBold from "./bold.hbs";
import markdownDividerBlock from "./divider-block.hbs";
import markdownImageBlock from "./image-block.hbs";
import markdownItalic from "./italic.hbs";
import markdownLink from "./link.hbs";
import markdownListBlockChild from "./list-block-child.hbs";
import markdownListBlockTop from "./list-block-top.hbs";
import markdownListBlock from "./list-block.hbs";
import markdownQuoteBlock from "./quote-block.hbs";
import markdownStrikethrough from "./strikethrough.hbs";
import markdownTextBlock from "./text-block.hbs";
import markdownUnderlined from "./underlined.hbs";
import markdownBulletList from "./../markdown/bullet-list.hbs";
import slackListItem from "./../slack/list-item.hbs";

const markdownHandlebarsPartials = {
  "action-block": markdownActionBlock,
  "bullet-list": markdownBulletList,
  "divider-block": markdownDividerBlock,
  "image-block": markdownImageBlock,
  "inline-image": notSupported,
  "jsonnet-block": notSupported,
  "list-block-child": markdownListBlockChild,
  "list-block-top": markdownListBlockTop,
  "list-block": markdownListBlock,
  "list-item": slackListItem,
  "quote-block": markdownQuoteBlock,
  "template-block": notSupported,
  "text-block": markdownTextBlock,
  bold: markdownBold,
  br: plainLineReturn,
  italic: markdownItalic,
  link: markdownLink,
  strikethrough: markdownStrikethrough,
  underlined: markdownUnderlined,
} as const;

export default markdownHandlebarsPartials;
