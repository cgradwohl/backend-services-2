import { ElementalNode } from "@trycourier/courier/lib/send/types";
import handlebars from "handlebars";

import courierHandlebarsHelpers from "../../helpers";
import courierHandlebarsPartials from "../../partials";
import IHandlebarsCompileOptions from "../../partials/compile-options";
import compilePartialsObject from "../../partials/compile-partials-object";
import lineReturns from "../line-returns";
import { ITemplateHandler } from "../types";

const compileOptions: IHandlebarsCompileOptions = {
  noEscape: true, // TODO: change to false after handlebars transition
};

const getElementalTemplateHandler = (
  templateString: string
): ITemplateHandler<"inApp">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const elements: ElementalNode[] = [];

    const elementalHandler = (element: ElementalNode) => {
      elements.push(element);
    };

    // don't use the returned string
    template(context, {
      data: {
        ...data,
        elementalHandler,
        blockSeparator: "\n",
        lineReturn: lineReturns.inApp,
        linkHandler: linkHandler.getScopedHandler("elemental"),
        serializer: "elemental",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.elemental,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.elemental,
        compileOptions
      ),
    });

    return elements;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getElementalHandlebarsTemplate = (
  template: string
): ITemplateHandler<"elemental"> => ({
  render: getElementalTemplateHandler(template),
  type: "elemental",
});

export default getElementalHandlebarsTemplate;
