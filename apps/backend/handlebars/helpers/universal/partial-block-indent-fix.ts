import { HelperOptions, SafeString } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage:
 * ```
 * {{#partial-block-indent-fix}}
 *   {{else}}{{> @partial-block }}{{/partial-block-indent-fix}}
 * ```
 *
 * This is a horrible hack to address the following handlebars issue:
 * https://github.com/handlebars-lang/handlebars.js/issues/1695
 *
 * Everything before the `{{else}}` will be used the indicate the indent level
 * and the partial block should immediately follow the else with the closing
 * tag right after.
 */
function partialBlockIndentFix(...args) {
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const indent = options.fn(this);
  const content = options.inverse(this);
  const lines = String(content).split("\n");
  return new SafeString(lines.map(line => `${indent}${line}`).join("\n"));
}

export default partialBlockIndentFix;
