import cheerio from "cheerio";
import handlebars from "handlebars";

import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = { noEscape: true };

/**
 * Given a compiled Handlebars template and fallback text, take a context,
 * variableHandler, and linkHandler and render the handlebars template.
 */
const getPlainTemplateHandler = (
  templateString: string,
  {
    blockSeparator = "\n\n",
    defaultText,
    scope = "plain",
    usingOverride = false,
  }: {
    blockSeparator?: string;
    defaultText?: string;
    scope?: string;
    usingOverride?: boolean;
  }
): ITemplateHandler<"plain">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const renderedTemplate = template(context, {
      data: {
        ...data,
        blockSeparator,
        lineReturn: lineReturns.plain,
        linkHandler: linkHandler.getScopedHandler(scope),
        serializer: "plain",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.plain,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.plain,
        compileOptions
      ),
    });

    if (usingOverride) {
      const $ = cheerio.load(renderedTemplate);
      const text = $("body").text().trim();
      return text;
    }

    return renderedTemplate.trim() !== "" ? renderedTemplate : defaultText;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getPlainHandlebarsTemplate = (
  template: string,
  options: {
    blockSeparator?: string;
    defaultText?: string;
    scope?: string;
    usingOverride?: boolean;
  } = {}
): ITemplateHandler<"plain"> => ({
  render: getPlainTemplateHandler(template, options),
  type: "plain",
});

export default getPlainHandlebarsTemplate;
