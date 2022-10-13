import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#trim-right}} test {{/trim-right}} or {{trim-right "  a string  "}}
 *
 * should:
 *   - return the value trimmed (defaults to block value)
 */
function trimRightHandlebarsHelper(this: any, ...args: any[]) {
  const [options, str = ""] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args);

  const value = options.fn ? options.fn(this) : str;

  return String(value).trimRight();
}

export default trimRightHandlebarsHelper;
