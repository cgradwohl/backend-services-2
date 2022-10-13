import notSupported from "../not-supported.hbs";
import actionBlock from "./action-block.hbs";
import textBlock from "./text-block.hbs";
import markdownLink from "../markdown/link.hbs";
import ghMarkdown from "../markdown-gh";

const partials = {
  ...ghMarkdown,
  "action-block": actionBlock,
  "divider-block": notSupported,
  "image-block": notSupported,
  "inline-image": notSupported,
  "jsonnet-block": notSupported,
  "list-block-child": notSupported,
  "list-block-top": notSupported,
  "list-block": notSupported,
  "markdown-block": notSupported,
  "quote-block": notSupported,
  "template-block": notSupported,
  "text-block": textBlock,
  br: notSupported,
  highlight: notSupported,
  link: markdownLink,
  "courier-email-head": notSupported,
  "courier-email-footer": notSupported,
  "courier-email-header": notSupported,
} as const;

export default partials;
