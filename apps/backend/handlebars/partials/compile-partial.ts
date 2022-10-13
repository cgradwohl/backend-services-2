import handlebars from "handlebars";

import IHandlebarsCompileOptions from "./compile-options";

const compilePartial = (hbs: string, options: IHandlebarsCompileOptions) => {
  const end = hbs.length - 1;

  // trim off the trailing \n
  if (hbs.charAt(end) === "\n") {
    hbs = hbs.substr(0, end);
  }

  return handlebars.compile(hbs, options);
};

export default compilePartial;
