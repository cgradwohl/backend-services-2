import { Exception, HelperOptions, SafeString, Utils } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: <b>{{inline-var customer.fullName}}</b>
 *
 * should:
 *   - use the variable handler to resolve a JSONPath
 *   - return the resolved value as a string
 *   - replace line returns in variables
 *   - only be used for text and not parameters for partials/helpers
 */
function inlineVarHandlebarsHelper(...args) {
  const [options, jsonPath] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args, "path");

  if (typeof jsonPath !== "string") {
    throw new Exception("#inline-var path argument must be a string");
  }

  const { lineReturn, serializer } = getHandlebarsData(options);
  const variableHandler = getHandlebarsVariableHandler(options);

  const text = variableHandler.replace(`{${jsonPath}}`);
  const lines = text.split(/\r?\n/g);

  if (serializer !== "email") {
    return lines.join(lineReturn);
  }

  // email line returns (<br>) will be escaped so we need to instead escape each
  // line ourselves, join with the line return, and mark as safe
  return new SafeString(
    lines.map((line) => Utils.escapeExpression(line)).join(lineReturn)
  );
}

export default inlineVarHandlebarsHelper;
