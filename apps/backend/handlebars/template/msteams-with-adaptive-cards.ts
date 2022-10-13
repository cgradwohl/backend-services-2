import { IEvaluationContext, Template } from "adaptivecards-templating";
import handlebars from "handlebars";
import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import { fixBoldMarkdownEdgeCase } from "./lib";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = {
  noEscape: true, // TODO: change to false after handlebars transition
};

/**
 * Given a compiled Handlebars template and fallback text, take a context,
 * variableHandler, and linkHandler and render the handlebars template.
 */
const getMSTeamsTemplateHandler = (
  templateString: string
): ITemplateHandler<"msteams">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    let adaptiveCard = null;

    const blockHandler = (...adaptiveCardPayload) => {
      [adaptiveCard] = adaptiveCardPayload
        .filter(({ type }) => type === "AdaptiveCard")
        .map((card) => {
          const cardTemplate = new Template(card);
          const cardContextIfAny: IEvaluationContext = {
            $root: {
              ...context,
            },
          };
          return cardTemplate.expand(cardContextIfAny);
        });

      return adaptiveCard;
    };

    const markdown = template(context, {
      data: {
        ...data,
        blockHandler,
        blockSeparator: "\n\n",
        lineReturn: lineReturns.msteams,
        linkHandler: linkHandler.getScopedHandler("md"),
        serializer: "markdown",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.markdown,
        ...courierHandlebarsHelpers.msteams,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.msteams,
        compileOptions
      ),
    });

    return [
      fixBoldMarkdownEdgeCase({
        md: markdown,
        marker: "**",
        tenantId: ((data ?? {}).tenantId as string) ?? "",
      }),
      adaptiveCard ?? null,
    ];
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getMSTeamsHandlebarsTemplate = (
  template: string
): ITemplateHandler<"msteams"> => ({
  render: getMSTeamsTemplateHandler(template),
  type: "msteams",
});

export default getMSTeamsHandlebarsTemplate;
