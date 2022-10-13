import handlebars from "handlebars";
import mjml2Html from "mjml";
import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = { noEscape: false };

/**
 * Given a compiled Handlebars template, take a context, variableHandler, and
 * linkHandler and render the handlebars template.
 */
const getEmailTemplateHandler = (
  templateString: string,
  {
    partials = {},
    usingOverride = false,
  }: {
    partials?: { [partial: string]: string };
    usingOverride?: boolean;
  } = {}
): ITemplateHandler<"email">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    // data scoped context because that's what we've always used for the template block
    const context = variableHandler.getContext().value;
    const renderedTemplate = template(context, {
      data: {
        ...data,
        templateWidth: "582px",
        blockSeparator: "\n",
        lineReturn: lineReturns.email,
        linkHandler: linkHandler.getScopedHandler("html"),
        serializer: "email",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.email,
      },
      partials: compilePartialsObject(
        {
          ...courierHandlebarsPartials.email,
          ...partials,
        },
        compileOptions
      ),
    });

    if (usingOverride) {
      return renderedTemplate;
    }

    const rendered = mjml2Html(renderedTemplate, {});

    return rendered.html;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getEmailHandlebarsTemplate = (
  template: string,
  options?: {
    partials?: { [partial: string]: string };
    usingOverride?: boolean;
  }
): ITemplateHandler<"email"> => ({
  render: getEmailTemplateHandler(template, options),
  type: "email",
});

export default getEmailHandlebarsTemplate;
