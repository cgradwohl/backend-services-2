import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#trim}}  test  {{/trim}} or {{trim "  a string  "}}
 *
 * should:
 *   - return the value trimmed (defaults to block value)
 */
function trimHandlebarsHelper(this: any, ...args: any[]) {
  const [options, str = ""] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args);

  const value = options.fn ? options.fn(this) : str;

  return String(value).trim();
}

export default trimHandlebarsHelper;
