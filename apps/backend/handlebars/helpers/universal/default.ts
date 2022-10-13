import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{default undefined "valued customer"}}
 *
 * should:
 *   - return the value if it is not nullish
 *   - return the defaultValue if the value is nullish
 */
function defaultHandlebarsHelper(...args) {
  const [, value, defaultValue] = assertHandlebarsArguments<
    [HelperOptions, any, any]
  >(args, "value", "defaultValue");

  return value !== undefined && value !== null ? value : defaultValue;
}

export default defaultHandlebarsHelper;
