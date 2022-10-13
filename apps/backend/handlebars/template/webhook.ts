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
const getTemplateHandler = (
  templateString: string
): ITemplateHandler<"webhook">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const blocks: object[] = [];

    const blockHandler = (block: object) => {
      if (Array.isArray(block)) {
        blocks.push(...block);
      } else {
        blocks.push(block);
      }
    };

    // don't use the returned string
    template(context, {
      data: {
        ...data,
        blockHandler,
        blockSeparator: "\n",
        lineReturn: lineReturns.webhook,
        linkHandler: linkHandler.getScopedHandler("webhook"),
        serializer: "webhook",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.webhook,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.webhook,
        compileOptions
      ),
    });

    return blocks?.[0];
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getHandlebarsTemplate = (
  template: string
): ITemplateHandler<"webhook"> => ({
  render: getTemplateHandler(template),
  type: "webhook",
});

export default getHandlebarsTemplate;
