import msteamsActionBlock from "../markdown/action-block.hbs";
import msteamsBold from "./bold.hbs";
import msteamsImageBlock from "../markdown/image-block.hbs";
import msteamsItalic from "../markdown/italic.hbs";
import msteamsLink from "../markdown/link.hbs";
import msteamsListBlockChild from "../markdown/list-block-child.hbs";
import msteamsListBlockTop from "../markdown/list-block-top.hbs";
import msteamsListBlock from "../markdown/list-block.hbs";
import msteamsQuoteBlock from "../markdown/quote-block.hbs";
import msteamsTextBlock from "../markdown/text-block.hbs";
import notSupported from "../not-supported.hbs";
import plainLineReturn from "../plain/br.hbs";
import markdownBulletList from "./../markdown/bullet-list.hbs";
import slackListItem from "./../slack/list-item.hbs";
import jsonnetBlock from "./jsonnet-block.hbs";

const msteamsHandlebarsPartials = {
  "action-block": msteamsActionBlock,
  "bullet-list": markdownBulletList,
  "divider-block": notSupported,
  highlight: notSupported,
  "image-block": msteamsImageBlock,
  "inline-image": notSupported,
  italic: msteamsItalic,
  "jsonnet-block": jsonnetBlock,
  link: msteamsLink,
  "list-block-child": msteamsListBlockChild,
  "list-block-top": msteamsListBlockTop,
  "list-block": msteamsListBlock,
  "list-item": slackListItem,
  "quote-block": msteamsQuoteBlock,
  "template-block": notSupported,
  "text-block": msteamsTextBlock,
  bold: msteamsBold,
  br: plainLineReturn,
} as const;

export default msteamsHandlebarsPartials;
