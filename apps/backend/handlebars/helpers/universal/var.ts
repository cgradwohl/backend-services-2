import { Exception, HelperOptions, SafeString, Utils } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: "{{var customer.fullName}}" <{{var "customer.email"}}>
 *
 * should:
 *   - use the variable handler to resolve a JSONPath
 *   - return the resolved value as a string
 *   - not be a SafeString so the value will be encoded
 */
function varHandlebarsHelper(...args) {
  const [options, jsonPath] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args, "path");

  if (typeof jsonPath !== "string") {
    throw new Exception("#var path argument must be a string");
  }

  const variableHandler = getHandlebarsVariableHandler(options);

  const text = variableHandler.replace(`{${jsonPath}}`);

  // WARNING: never return SafeString() because helpers expect a `string` value
  //          and will choke on the SafeString instance.
  return text;
}

export default varHandlebarsHelper;
