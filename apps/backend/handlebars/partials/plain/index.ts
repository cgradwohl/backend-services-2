import notSupported from "../not-supported.hbs";
import plainActionBlock from "./action-block.hbs";
import plainBulletList from "./bullet-list.hbs";
import plainListItem from "./list-item.hbs";
import plainDividerBlock from "./divider-block.hbs";
import plainImageBlock from "./image-block.hbs";
import plainLineReturn from "./br.hbs";
import plainLink from "./link.hbs";
import plainParagraph from "./paragraph.hbs";
import plainListBlock from "./list-block.hbs";
import plainListBlockChild from "./list-block-child.hbs";
import plainListBlockTop from "./list-block-top.hbs";
import plainQuoteBlock from "./quote-block.hbs";
import plainTextBlock from "./text-block.hbs";

const plainHandlebarsPartials = {
  "action-block": plainActionBlock,
  "bullet-list": plainBulletList,
  "divider-block": plainDividerBlock,
  "column-block": notSupported,
  "image-block": plainImageBlock,
  "inline-image": notSupported,
  "jsonnet-block": notSupported,
  "list-block-child": plainListBlockChild,
  "list-block-top": plainListBlockTop,
  "list-block": plainListBlock,
  "list-item": plainListItem,
  "paragraph-block": plainParagraph,
  "quote-block": plainQuoteBlock,
  "template-block": notSupported,
  "text-block": plainTextBlock,
  br: plainLineReturn,
  link: plainLink,
} as const;

export default plainHandlebarsPartials;
