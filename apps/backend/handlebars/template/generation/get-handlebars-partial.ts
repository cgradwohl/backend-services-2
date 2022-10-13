import getHandlebarsHashParameters from "./get-handlebars-hash-parameters";

interface IHashParameters {
  [key: string]: any;
}

const getHashParametersForPartial = (params?: IHashParameters): string => {
  const renderedHashParams = getHandlebarsHashParameters(params);
  if (!renderedHashParams) {
    return "";
  }

  // use helper for stashing the params in a symbol property so we can
  // safely retrieve them using the `courier-partial` helper (and not
  // override customer data)
  return ` (params${renderedHashParams})`;
};

const getHandlebarsPartial = (
  name: string,
  options: {
    children?: string;
    params?: IHashParameters;
  } = {}
): string => {
  const { children, params } = options;

  const hashParameters = getHashParametersForPartial(params);

  if (children || children === "") {
    return `{{#>${name}${hashParameters}}}${children}{{/${name}}}`;
  }

  return `{{>${name}${hashParameters}}}`;
};

export default getHandlebarsPartial;
