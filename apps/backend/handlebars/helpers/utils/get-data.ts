import { Exception, HelperOptions } from "handlebars";

const getHandlebarsData = (options: HelperOptions) => {
  if (!options.data) {
    throw new Exception(`#${(options as any).name}: data is not present`);
  }

  return options.data;
};

export default getHandlebarsData;
