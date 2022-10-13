import { ITemplateBlock } from "~/types.api";

import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import { TemplateConfig } from "../../types";

const getHandlebarsFromTemplateBlock = (
  block: ITemplateBlock,
  config?: TemplateConfig
) => {
  const { conditional, template, locales, ...params } = block.config;

  const children = config?.locale
    ? locales?.[config.locale] ?? template
    : template;

  return getHandlebarsPartial("template-block", { children, params });
};

export default getHandlebarsFromTemplateBlock;
