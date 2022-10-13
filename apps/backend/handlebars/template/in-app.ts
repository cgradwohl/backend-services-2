import handlebars from "handlebars";

import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = {
  noEscape: true, // TODO: change to false after handlebars transition
};

const getInAppTemplateHandler = (
  templateString: string,
  options?: {
    version: "plain" | "markdown";
  }
): ITemplateHandler<"inApp">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const blocks: object[] = [];

    const blockHandler = (block: object) => {
      blocks.push(block);
    };

    if (!options?.version || options?.version === "plain") {
      courierHandlebarsPartials.inApp = {
        ...courierHandlebarsPartials.inApp,
        bold: undefined,
        br: undefined,
        italic: undefined,
        link: undefined,
        strikethrough: undefined,
      };
    }

    // don't use the returned string
    template(context, {
      data: {
        ...data,
        blockHandler,
        blockSeparator: "\n",
        lineReturn: lineReturns.inApp,
        linkHandler: linkHandler.getScopedHandler("inApp"),
        serializer: "inApp",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.inApp,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.inApp,
        compileOptions
      ),
    });

    return blocks;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getInAppHandlebarsTemplate = (
  template: string,
  options?: {
    version: "plain" | "markdown";
  }
): ITemplateHandler<"inApp"> => ({
  render: getInAppTemplateHandler(template, options),
  type: "inApp",
});

export default getInAppHandlebarsTemplate;
