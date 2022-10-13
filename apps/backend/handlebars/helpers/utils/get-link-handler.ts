import { Exception, HelperOptions } from "handlebars";

import { ILinkHandler } from "~/lib/link-handler";

import getHandlebarsData from "./get-data";

const getHandlebarsLinkHandler = (options: HelperOptions) => {
  const linkHandler: ILinkHandler = getHandlebarsData(options).linkHandler;

  if (!linkHandler) {
    throw new Exception(
      `#${(options as any).name}: linkHandler is not present`
    );
  }

  return linkHandler;
};

export default getHandlebarsLinkHandler;
