import { IActionBlock } from "~/types.api";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getComplexHandlebarsText from "../../generation/get-complex-handlebars-text";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import { TemplateConfig } from "../../types";

const getHandlebarsFromActionBlock = (
  block: IActionBlock,
  config?: TemplateConfig
) => {
  const {
    actionId,
    backgroundColor,
    conditional,
    href,
    text,
    locales,
    ...options
  } = block.config;
  const blockText = config?.locale ? locales?.[config.locale] ?? text : text;

  const children = getComplexHandlebarsText(blockText);
  const params = {
    ...options,
    actionId: getComplexHandlebarsParameter(actionId),
    backgroundColor: getComplexHandlebarsParameter(backgroundColor),
    href: getComplexHandlebarsParameter(href),
  };
  return getHandlebarsPartial("action-block", { children, params });
};

export default getHandlebarsFromActionBlock;
