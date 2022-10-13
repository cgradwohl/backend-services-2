import { Exception, HelperOptions } from "handlebars";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#replace-all "hello" "goodbye"}}
 *
 * should:
 *   - replaces all hello with goodbye
 */
function replaceAllHandlebarsHelper(...args) {
  const [options, search, value] = assertHandlebarsArguments<
    [HelperOptions, string, string]
  >(args);

  if (!search) {
    throw new Exception("#replace-all must have a search value");
  }

  if (typeof value === "undefined") {
    throw new Exception("#replace-all must have a replace value");
  }

  const str = options.fn(this);
  const replacer = new RegExp(search, "g");

  return String(str).replace(replacer, value);
}

export default replaceAllHandlebarsHelper;
