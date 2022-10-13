import { IQuoteBlock } from "~/types.api";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getHandlebarsFromSlate from "../../slate";
import { TemplateConfig } from "../../types";

const getHandlebarsFromQuoteBlock = (
  block: IQuoteBlock,
  config?: TemplateConfig
) => {
  const { borderColor, value, locales } = block.config;
  const blockValue = config?.locale ? locales?.[config.locale] ?? value : value;
  const children = getHandlebarsFromSlate(blockValue);
  const params = {
    borderColor: getComplexHandlebarsParameter(borderColor),
  };

  return getHandlebarsPartial(`quote-block`, { children, params });
};

export default getHandlebarsFromQuoteBlock;
