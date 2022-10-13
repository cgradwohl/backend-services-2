import { IJsonnetBlock } from "~/types.api";

import getHandlebarsPartial from "../../generation/get-handlebars-partial";

const getHandlebarsFromJsonnetBlock = (block: IJsonnetBlock) => {
  const { conditional, ...params } = block.config;
  return getHandlebarsPartial("jsonnet-block", { params });
};

export default getHandlebarsFromJsonnetBlock;
