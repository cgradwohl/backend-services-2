import handlebars from "handlebars";

import courierHandlebarsHelpers from "../helpers";
import IHandlebarsCompileOptions from "../partials/compile-options";
import getComplexHandlebarsText from "./generation/get-complex-handlebars-text";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = { noEscape: true };

interface ITextTemplateHandler {
  text?: string;
  defaultText?: string;
  unsafe?: boolean;
  cb?: (value: string) => string;
}

/**
 * Given text and fallback text, take a context, variableHandler, and linkHandler
 * and render the handlebars template.
 */
const getTextTemplateHandler = ({
  text,
  defaultText,
  unsafe,
  cb,
}: ITextTemplateHandler): ITemplateHandler<"text">["render"] => {
  // needs to support undefined for fields that are optional (think bcc, cc, etc.)
  if (!text || !text.trim()) {
    return () => defaultText;
  }

  const textTemplate = getComplexHandlebarsText(text, { unsafe });

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;
    const template = handlebars.compile(textTemplate, compileOptions);

    const renderedTemplate = template(context, {
      data: {
        ...data,
        lineReturn: lineReturns.text,
        linkHandler,
        serializer: "text",
        variableHandler,
      },
      helpers: courierHandlebarsHelpers.universal,
    });

    const text =
      renderedTemplate.trim() !== "" ? renderedTemplate : defaultText;

    if (cb) {
      return cb(text);
    }

    return text;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getTextHandlebarsTemplate = (
  params: ITextTemplateHandler
): ITemplateHandler<"text"> => ({
  render: getTextTemplateHandler(params),
  type: "text",
});

export default getTextHandlebarsTemplate;
