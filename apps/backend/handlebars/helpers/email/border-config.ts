import { HelperOptions, SafeString } from "handlebars";
import variablePattern from "~/lib/variable-pattern";
import { IBorderConfig } from "~/types.api";
import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: {{border-config @border}}
 *
 * should:
 *   - return the value of rtl or ltr
 */
function borderConfigHelper(...args) {
  const [options, borderEnabled] = assertHandlebarsArguments<
    [HelperOptions, IBorderConfig]
  >(args, "borderEnabled");
  if (!borderEnabled) {
    return "";
  }

  const variableHandler = getHandlebarsVariableHandler(options);

  let { color = "grey" } = options.hash;
  const { size = "2px" } = options.hash;

  if (color.match(variablePattern)) {
    color = variableHandler.replace(`${color}`);
  }

  return new SafeString(` border="${size} solid ${color}"`);
}

export default borderConfigHelper;
