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

/**
 * Given a compiled Handlebars template and fallback text, take a context,
 * variableHandler, and linkHandler and render the handlebars template.
 */
const getDiscordTemplateHandler = (
  templateString: string
): ITemplateHandler<"discord">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    return template(context, {
      data: {
        ...data,
        blockSeparator: "\n",
        lineReturn: lineReturns.discord,
        linkHandler: linkHandler.getScopedHandler("discord"),
        serlializer: "discord",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.markdown,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.discord,
        compileOptions
      ),
    });
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getDiscordHandlebarsTemplate = (
  template: string
): ITemplateHandler<"discord"> => ({
  render: getDiscordTemplateHandler(template),
  type: "discord",
});

export default getDiscordHandlebarsTemplate;
