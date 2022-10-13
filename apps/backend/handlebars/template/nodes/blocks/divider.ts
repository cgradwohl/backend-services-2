import { IDividerBlock } from "~/types.api";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";

const getHandlebarsFromDividerBlock = (block: IDividerBlock): string => {
  const { conditional, dividerColor, ...options } = block.config;
  const params = {
    ...options,
    dividerColor: getComplexHandlebarsParameter(dividerColor),
  };
  return getHandlebarsPartial("divider-block", { params });
};

export default getHandlebarsFromDividerBlock;
