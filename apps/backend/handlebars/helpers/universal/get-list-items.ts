import { Exception, HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: {{each (get-list-items "items")}}
 *
 * should:
 *   - return the value if it is not nullish
 *   - return the defaultValue if the value is nullish
 */
function getListItemsHandlebarsHelper(...args) {
  const [options, jsonPath] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args, "path");

  if (typeof jsonPath !== "string") {
    throw new Exception("#path's path argument must be a string");
  }

  const variableHandler = getHandlebarsVariableHandler(options);

  const value = variableHandler.resolveV2(jsonPath);

  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  // We are left with an object. We are currently using an "each" helper to loop
  // over all the items and the handlebars each helper, when given an object,
  // will loop over all object keys instead of our desired behavior of looping
  // once with our object. So we have this helper and we return the object in
  // an array.
  return [value];
}

export default getListItemsHandlebarsHelper;
