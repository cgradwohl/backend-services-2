import { Exception, HelperOptions } from "handlebars";
import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: {{#if (path "customer.email")}}
 *
 * should:
 *   - use the variable handler to resolve a JSONPath
 *   - return the resolved value
 *   - return undefined if the value was not found
 */
function pathHandlebarsHelper(...args) {
  const [options, jsonPath] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args, "path");

  if (typeof jsonPath !== "string") {
    throw new Exception("#path's path argument must be a string");
  }

  const variableHandler = getHandlebarsVariableHandler(options);

  return variableHandler.resolveV2(jsonPath);
}

export default pathHandlebarsHelper;
