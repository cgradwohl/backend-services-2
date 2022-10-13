import { IColumnBlock } from "~/types.api";

import getHandlebarsPartial from "../../generation/get-handlebars-partial";

const getHandlebarsFromColumnBlock = (block: IColumnBlock) => {
  const params = block.config;
  const partial = getHandlebarsPartial("column-block", { params });
  return partial;
};

export default getHandlebarsFromColumnBlock;
