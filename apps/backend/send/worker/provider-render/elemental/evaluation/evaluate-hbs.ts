import handlebars from "handlebars";
import { ElementalNode, ElementalNodeIR } from "~/api/send/types";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";

export const supportedFields = ["content", "title", "href", "src"] as const;

export function evaluateHbsOfElement(
  element: ElementalNodeIR,
  data: any
): ElementalNodeIR {
  const copy = { ...element };

  supportedFields.forEach((field) => {
    if (field in copy) {
      copy[field] = render(copy[field], data);
    }
  });

  return copy;
}

export function elementHasHbsSupportedField(element: ElementalNode): boolean {
  return Object.keys(element).some((key) =>
    (supportedFields as ReadonlyArray<string>).includes(key)
  );
}

function render(content: string, data: any): string {
  try {
    const template = handlebars.compile(content, { noEscape: true });
    return template(data);
  } catch (error: any) {
    throw new HandlebarsEvalError(error.message);
  }
}
