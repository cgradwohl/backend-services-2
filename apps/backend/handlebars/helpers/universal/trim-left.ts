import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#trim-left}}  test  {{/trim-left}} or {{trim-left "  a string  "}}
 *
 * should:
 *   - return the value trimmed (defaults to block value)
 */
function trimLeftHandlebarsHelper(this: any, ...args: any[]) {
  const [options, str = ""] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args);

  const value = options.fn ? options.fn(this) : str;

  return String(value).trimLeft();
}

export default trimLeftHandlebarsHelper;
