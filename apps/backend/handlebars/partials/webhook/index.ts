import notSupported from "../not-supported.hbs";
import jsonnetBlock from "./jsonnet-block.hbs";

const partials = {
  "action-block": notSupported,
  bold: notSupported,
  br: notSupported,
  "divider-block": notSupported,
  highlight: notSupported,
  "image-block": notSupported,
  "inline-image": notSupported,
  italic: notSupported,
  "jsonnet-block": jsonnetBlock,
  link: notSupported,
  "list-block": notSupported,
  "list-block-child": notSupported,
  "list-block-top": notSupported,
  "markdown-block": notSupported,
  "quote-block": notSupported,
  "template-block": notSupported,
  "text-block": notSupported,
  "text-color": notSupported,
};

export default partials;
