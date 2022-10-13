import { ElementalChannelNode, ElementalNode } from "~/api/send/types";
import { IVariableHandler } from "~/lib/variable-handler";
import handlebars from "handlebars";
import mjml2Html from "mjml";
import sanitizeHtml from "sanitize-html";
import logger from "~/lib/logger";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";

export function getChannelOverrides({
  elements,
  channel,
  variableHandler,
}: {
  elements: ElementalNode[];
  channel: string;
  variableHandler: IVariableHandler;
}): Record<string, any> | undefined {
  const element = elements.find(
    (element) =>
      element.type === "channel" &&
      element.channel === channel &&
      element.raw !== undefined
  ) as ElementalChannelNode | undefined;

  if (!element) {
    return undefined;
  }

  const overrides = { ...element.raw };

  if ("html" in overrides && "transformers" in overrides) {
    // We may want to move this into the main `evaluate-hbs` function as the logic is duplicative.
    // I believe the reason we don't is because the user is allowed to define transformers. A
    // feature unique to raw channel content.
    overrides["html"] = transformHTML({
      html: overrides.html,
      transformers: overrides.transformers,
      variableHandler,
    });
    delete overrides.transformers;
  }

  return Object.keys(overrides).length ? overrides : undefined;
}

function transformHTML({
  html,
  transformers,
  variableHandler,
}: {
  html: string;
  transformers: string[];
  variableHandler: IVariableHandler;
}): string {
  let transformedHTML = html;

  if (transformers.includes("handlebars")) {
    const context = variableHandler.getScoped("data")?.getContext().value;
    transformedHTML = renderHbsTemplate(transformedHTML, context);
  }

  if (transformers.includes("mjml")) {
    const rendered = mjml2Html(transformedHTML, {});

    if (rendered.errors.length) {
      logger.error(rendered.errors);
    }

    transformedHTML = rendered.html;
  }

  return sanitizeHtml(transformedHTML);
}

function renderHbsTemplate(hbs: string, context: any): string {
  try {
    const template = handlebars.compile(hbs, { noEscape: true });
    return template(context);
  } catch (error) {
    throw new HandlebarsEvalError(error.message);
  }
}
