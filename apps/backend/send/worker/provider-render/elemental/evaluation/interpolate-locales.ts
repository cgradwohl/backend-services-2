import { ElementalIR } from "~/api/send/types";

export const supportedFields = [
  "content",
  "title",
  "href",
  "src",
  "raw", // For raw channel content
  "elements", // For channel and group
] as const;

export function interpolateLocales({
  ir,
  locale,
}: {
  ir: ElementalIR;
  locale?: string;
}): ElementalIR {
  if (!locale) {
    return ir;
  }

  return ir.map((element) => {
    const copy = { ...element };

    if ("locales" in copy) {
      supportedFields.forEach((field) => {
        if (!(field in copy)) return;
        const localeContent = copy.locales[locale]?.[field];
        copy[field] = localeContent ?? copy[field];
      });
    }

    if ("elements" in copy) {
      copy.elements = interpolateLocales({
        ir: copy.elements,
        locale,
      });
    }

    return copy;
  });
}
