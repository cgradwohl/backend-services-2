import handlebars from "handlebars";

import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import ghMarkdownPartials from "../partials/markdown-gh";

import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";
import { fixBoldMarkdownEdgeCase } from "./lib";

const compileOptions: IHandlebarsCompileOptions = {
  noEscape: true, // TODO: change to false after handlebars transition
};

/**
 * Given a compiled Handlebars template and fallback text, take a context,
 * variableHandler, and linkHandler and render the handlebars template.
 */
const getMarkdownTemplateHandler = (
  templateString: string,
  flavor?: "github"
): ITemplateHandler<"markdown">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  const markdownPartials =
    flavor === "github"
      ? {
          ...courierHandlebarsPartials.markdown,
          ...ghMarkdownPartials,
        }
      : courierHandlebarsPartials.markdown;

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const md = template(context, {
      data: {
        ...data,
        blockSeparator: "\n",
        lineReturn: lineReturns.markdown,
        linkHandler: linkHandler.getScopedHandler("md"),
        serializer: "markdown",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.markdown,
      },
      partials: compilePartialsObject(markdownPartials, compileOptions),
    });

    return fixBoldMarkdownEdgeCase({
      md,
      marker: "*",
      tenantId: ((data ?? {}).tenantId as string) ?? "",
    });
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getMarkdownHandlebarsTemplate = (
  template: string,
  flavor?: "github"
): ITemplateHandler<"markdown"> => ({
  render: getMarkdownTemplateHandler(template, flavor),
  type: "markdown",
});

export default getMarkdownHandlebarsTemplate;
