import emailActionBlock from "./action-block.hbs";
import emailBold from "./bold.hbs";
import emailBulletList from "./bullet-list.hbs";
import emailDividerBlock from "./divider-block.hbs";
import emailHighlight from "./highlight.hbs";
import emailColumn from "./column.hbs";
import emailImageBlock from "./image-block.hbs";
import emailInlineImage from "./inline-image.hbs";
import emailItalic from "./italic.hbs";
import emailLineReturn from "./br.hbs";
import emailLink from "./link.hbs";
import emailListBlock from "./list-block.hbs";
import emailListBlockChild from "./list-block-child.hbs";
import emailListBlockTop from "./list-block-top.hbs";
import emailListItem from "./list-item.hbs";
import emailMarkdownBlock from "./markdown-block.hbs";
import emailQuoteBlock from "./quote-block.hbs";
import emailStrikethrough from "./strikethrough.hbs";
import emailTemplate from "./template.hbs";
import emailTemplateBlock from "./template-block.hbs";
import emailTextBlock from "./text-block.hbs";
import emailTextColor from "./text-color.hbs";
import emailUnderlined from "./underlined.hbs";

import notSupported from "../not-supported.hbs";

const emailHandlebarsPartials = {
  "action-block": emailActionBlock,
  "bullet-list": emailBulletList,
  "courier-template": emailTemplate,
  "column-block": emailColumn,
  "divider-block": emailDividerBlock,
  "image-block": emailImageBlock,
  "inline-image": emailInlineImage,
  "jsonnet-block": notSupported,
  "list-block-child": emailListBlockChild,
  "list-block-top": emailListBlockTop,
  "list-block": emailListBlock,
  "list-item": emailListItem,
  "markdown-block": emailMarkdownBlock,
  "quote-block": emailQuoteBlock,
  "template-block": emailTemplateBlock,
  "text-block": emailTextBlock,
  "text-color": emailTextColor,
  bold: emailBold,
  br: emailLineReturn,
  highlight: emailHighlight,
  italic: emailItalic,
  link: emailLink,
  strikethrough: emailStrikethrough,
  underlined: emailUnderlined,
} as const;

export default emailHandlebarsPartials;
