import { TemplateDelegate } from "handlebars";

import IHandlebarsCompileOptions from "./compile-options";
import compilePartial from "./compile-partial";

export interface ICompiledPartials {
  [partial: string]: TemplateDelegate<any>;
}

const compilePartialsObject = (
  partials: {
    [partial: string]: string;
  },
  compileOptions: IHandlebarsCompileOptions = {}
): ICompiledPartials => {
  return Object.entries(partials).reduce(
    (compiledPartials: ICompiledPartials, [partialName, partial]) => {
      if (partial === undefined) {
        return compiledPartials;
      }

      compiledPartials[partialName] = compilePartial(partial, compileOptions);
      return compiledPartials;
    },
    {}
  );
};

export default compilePartialsObject;
