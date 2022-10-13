import { Exception, HelperOptions } from "handlebars";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{inc value}}
 *
 * should:
 *   - increase value by 1
 */
function incHandlebarsHelper(...args) {
  const [, value] = assertHandlebarsArguments<
    [HelperOptions, any, string, any]
  >(args, "value");

  return Number(value) + 1;
}

export default incHandlebarsHelper;
