import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getHandlebarsFromSlate from "../../slate";

import { ITextBlock } from "~/types.api";
import { TemplateConfig } from "../../types";

const getHandlebarsFromTextBlock = (
  block: ITextBlock,
  provider?: string,
  config?: TemplateConfig
) => {
  const {
    border,
    backgroundColor,
    conditional,
    value,
    locales,
    allowHbs,
    ...options
  } = block.config;

  const blockValue = config?.locale ? locales?.[config.locale] ?? value : value;

  const children =
    provider?.includes("slack") && options.textStyle === "h1"
      ? getHandlebarsFromSlate(blockValue, { plain: true })
      : getHandlebarsFromSlate(blockValue, { allowHbs });

  const params = {
    ...options,
    borderEnabled: border?.enabled,
    borderColor: getComplexHandlebarsParameter(border?.color),
    borderSize: border?.size,
    backgroundColor: getComplexHandlebarsParameter(
      backgroundColor !== "transparent" ? backgroundColor : undefined
    ),
  };

  return getHandlebarsPartial(`text-block`, { children, params });
};

export default getHandlebarsFromTextBlock;
