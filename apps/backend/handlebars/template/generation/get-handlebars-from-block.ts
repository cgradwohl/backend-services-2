import getHandlebarsFromActionBlock from "../nodes/blocks/action";
import getHandlebarsFromColumnBlock from "../nodes/blocks/column";
import getHandlebarsFromDividerBlock from "../nodes/blocks/divider";
import getHandlebarsFromImageBlock from "../nodes/blocks/image";
import getHandlebarsFromJsonnetBlock from "../nodes/blocks/jsonnet";
import getHandlebarsFromListBlock from "../nodes/blocks/list";
import getHandlebarsFromMarkdownBlock from "../nodes/blocks/markdown";
import getHandlebarsFromQuoteBlock from "../nodes/blocks/quote";
import getHandlebarsFromTemplateBlock from "../nodes/blocks/template";
import getHandlebarsFromTextBlock from "../nodes/blocks/text";
import getHandlebarsBlockConditional from "./get-handlebars-block-conditional";
import getHandlebarsParameter from "./get-handlebars-parameter";

import { TemplateConfig } from "~/handlebars/template/types";
import { Block } from "~/types.api";

const getBlockPartial = (
  block: Block,
  provider?: string,
  config?: TemplateConfig
): string => {
  switch (block.type) {
    case "action":
      return getHandlebarsFromActionBlock(block, config);
    case "column":
      return getHandlebarsFromColumnBlock(block);
    case "divider":
      return getHandlebarsFromDividerBlock(block);
    case "image":
      return getHandlebarsFromImageBlock(block);
    case "jsonnet":
      return getHandlebarsFromJsonnetBlock(block);
    case "line":
    case "text":
      return getHandlebarsFromTextBlock(
        { ...block, type: "text" },
        provider,
        config
      );
    case "list":
      return getHandlebarsFromListBlock(block, config);
    case "markdown":
      return getHandlebarsFromMarkdownBlock(block, config);
    case "quote":
      return getHandlebarsFromQuoteBlock(block, config);
    case "template":
      return getHandlebarsFromTemplateBlock(block, config);
    default:
      return "";
  }
};

const getHandlebarsFromBlock = (
  block: Block,
  provider?: string,
  config?: TemplateConfig
): string => {
  const {
    config: { conditional },
  } = block;
  const blockPartial = getBlockPartial(block, provider, config);
  const content = `{{#courier-block ${getHandlebarsParameter(
    block.id
  )}}}${blockPartial}{{/courier-block}}`;

  return getHandlebarsBlockConditional(content, conditional);
};

export default getHandlebarsFromBlock;
