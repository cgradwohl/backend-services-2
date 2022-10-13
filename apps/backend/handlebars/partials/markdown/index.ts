import notSupported from "../not-supported.hbs";
import plainLineReturn from "../plain/br.hbs";
import markdownActionBlock from "./action-block.hbs";
import markdownBold from "./bold.hbs";
import markdownBulletList from "./bullet-list.hbs";
import markdownDividerBlock from "./divider-block.hbs";
import markdownImageBlock from "./image-block.hbs";
import markdownItalic from "./italic.hbs";
import markdownLink from "./link.hbs";
import markdownListBlockChild from "./list-block-child.hbs";
import markdownListBlockTop from "./list-block-top.hbs";
import markdownListBlock from "./list-block.hbs";
import markdownListItem from "./list-item.hbs";
import markdownQuoteBlock from "./quote-block.hbs";
import markdownTextBlock from "./text-block.hbs";
import markdownParagraph from "./paragraph.hbs";

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
  "list-item": markdownListItem,
  "paragraph-block": markdownParagraph,
  "quote-block": markdownQuoteBlock,
  "template-block": notSupported,
  "text-block": markdownTextBlock,
  bold: markdownBold,
  br: plainLineReturn,
  italic: markdownItalic,
  link: markdownLink,
} as const;

export default markdownHandlebarsPartials;
