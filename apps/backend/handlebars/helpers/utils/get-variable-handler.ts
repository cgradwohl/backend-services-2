import { Exception, HelperOptions } from "handlebars";

import { IVariableHandler } from "~/lib/variable-handler";

import getHandlebarsData from "./get-data";

const getHandlebarsVariableHandler = (options: HelperOptions) => {
  const variableHandler: IVariableHandler = getHandlebarsData(options)
    .variableHandler;

  if (!variableHandler) {
    throw new Exception(
      `#${(options as any).name}: variableHandler is not present`
    );
  }

  return variableHandler;
};

export default getHandlebarsVariableHandler;
