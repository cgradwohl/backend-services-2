import { HelperOptions, SafeString, template } from "handlebars";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{column-width @size layout=@layout width=@width index=@index}}
 *
 * should:
 *   - return nothing for default width
 *   - returns width for each column
 */
function columnWidthHelper(...args) {
  const [options, size] = assertHandlebarsArguments<
    [HelperOptions, number | number]
  >(args, "size");
  if (size > 2 || !options.hash.width || options.hash.layout === "center") {
    return "";
  }

  const paddingConstant = 63;
  const templateWidth: number = parseInt(options.data.templateWidth);
  const columnWidth: number = parseInt(options.hash.width);
  const isPercentage = options.hash.width.includes("%");
  let isPixel = options.hash.width.includes("px");

  let columnWidthPx;
  let columnWidthPct;
  let restWidthPx;
  let restWidthPct;

  if (!isPercentage && !isPixel) {
    isPixel = true;
  }

  if (isPixel) {
    const percentage = Math.floor((columnWidth / templateWidth) * 100);
    columnWidthPx = `${columnWidth}px`;
    columnWidthPct = `${percentage}%`;

    restWidthPct = `${100 - percentage}%`;
    restWidthPx = `${templateWidth - 63 - columnWidth}px`;
  }

  if (isPercentage) {
    columnWidthPx = `${(columnWidth / 100) * templateWidth}px`;
    columnWidthPct = `${columnWidth}%`;
    restWidthPct = `${100 - columnWidth}%`;
    restWidthPx = `${Math.floor((restWidthPct / 100) * templateWidth)}px`;
  }

  const indexForWidth =
    options.hash.layout === "left" ? 0 : options.data.columns.length - 1;

  if (options.hash.index === indexForWidth) {
    if (options.hash.groupColumns || isPercentage) {
      return new SafeString(`width="${columnWidthPct}"`);
    }

    return new SafeString(`width="${columnWidthPx}"`);
  }

  if (options.hash.groupColumns || isPercentage) {
    return new SafeString(`width="${restWidthPct}"`);
  }

  if (isPixel) {
    return new SafeString(`width="${restWidthPx}"`);
  }

  return "";
}

export default columnWidthHelper;
