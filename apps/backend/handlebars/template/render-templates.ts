import DOMPurify from "isomorphic-dompurify";
import { ApiSendRequestOverride } from "types.public";
import enableDomPurify from "~/lib/enable-dom-purify";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { ValueOf } from "~/types.internal";
import {
  ITemplateHandler,
  ITemplateHandlerReturnTypes,
  TemplateHandlerType,
} from "./types";

export type TemplateHandlerReturnTypes = {
  [K in TemplateHandlerType]: ITemplateHandlerReturnTypes[K];
}[TemplateHandlerType];

interface ITemplatesMap {
  [template: string]: ITemplateHandler<TemplateHandlerType>;
}

export interface IRenderedTemplatesMap {
  [template: string]: TemplateHandlerReturnTypes;
}

/**
 * Find the first template type that is not "plain" or "text". We render a
 * "plain" version of email, slack, and markdown. If any of those exist,
 * consider it to be the "primarySerializer"; otherwise, default to "plain".
 */
const getPrimarySerializer = (templates: {
  [template: string]: { type: TemplateHandlerType };
}): TemplateHandlerType => {
  return (
    Object.keys(templates)
      .map((template) => templates[template]?.type)
      .find(
        (serializerType) =>
          serializerType !== "text" && serializerType !== "plain"
      ) || "plain"
  );
};

const renderTemplates = (
  templateMap: ITemplatesMap,
  variableHandler: IVariableHandler,
  linkHandler: ILinkHandler,
  tenantId: string, // this is ugly but we need to tailgate DOMpurify
  channelOverride?: ValueOf<ApiSendRequestOverride["channel"]>
): IRenderedTemplatesMap => {
  const primarySerializer = getPrimarySerializer(templateMap);
  const dataScopedVariableHandler = variableHandler.getScoped("data");
  let rendered;
  try {
    rendered = Object.entries(templateMap).reduce(
      (renderedTemplates: IRenderedTemplatesMap, [templateName, handler]) => {
        if (channelOverride?.[templateName]) {
          renderedTemplates[templateName] = channelOverride?.[templateName];
          return renderedTemplates;
        }

        renderedTemplates[templateName] = handler?.render(
          dataScopedVariableHandler,
          linkHandler,
          {
            primarySerializer,
            tenantId, // TODO: Remove - Used to verify bold whitespace edge case fix
          }
        );

        if (templateName === "html" && enableDomPurify(tenantId)) {
          renderedTemplates[templateName] = DOMPurify.sanitize(
            renderedTemplates[templateName].toString(),
            {
              WHOLE_DOCUMENT: true,
            }
          );
        }

        return renderedTemplates;
      },
      {}
    );

    return rendered;
  } catch (err) {
    const isPartialError = err
      ?.toString()
      .match(/The partial (.+) could not be found/);

    if (isPartialError !== null) {
      throw new HandlebarsEvalError(err.toString());
    }

    const isParseError =
      err?.toString().match(/Parse error on line [0-9]+.*/) !== null;

    if (isParseError) {
      throw new HandlebarsEvalError(err.toString());
    }

    throw err;
  }
};

export default renderTemplates;
