import { IMarkdownBlock } from "~/types.api";

import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getHandlebarsFromSlate from "../../slate";
import { TemplateConfig } from "../../types";

const getHandlebarsFromMarkdownBlock = (
  block: IMarkdownBlock,
  config?: TemplateConfig
): string => {
  const { value, locales } = block.config;
  const blockValue = config?.locale ? locales?.[config.locale] ?? value : value;

  // not ideal... might need to come back to this and have a
  // custom slate handler for markdown.
  const children = getHandlebarsFromSlate(blockValue, { plain: true });

  return getHandlebarsPartial("markdown-block", { children });
};

export default getHandlebarsFromMarkdownBlock;
