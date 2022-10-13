import { HelperOptions } from "handlebars";
import direction from "direction";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{text-direction "my text"}}
 *
 * should:
 *   - return the value of rtl or ltr
 */
function textDirectionHelper(...args) {
  const [, value = ""] = assertHandlebarsArguments<[HelperOptions, any, any]>(
    args,
    "value"
  );

  const textDirection = direction(value);

  if (textDirection !== "rtl") {
    return "";
  }

  return `text-${textDirection}`;
}

export default textDirectionHelper;
