import { HelperOptions } from "handlebars";

import { filterOperationWithTypeMatch } from "~/lib/conditional-filter";
import { ConditionalFilterOperator } from "~/types.api";
import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

/**
 * usage: {{conditional (filter "data" "customer.name" "EQUALS" "josh") (filter "profile" "email" "CONTAINS" "@courier.com")}}
 *
 * should:
 *   - require a source, sourceProperty and operator
 *   - value is optional as IS_EMPTY and NOT_EMPTY operators do not need it
 *   - get source operand from source + sourceProperty
 *   - use operator to compare source operand with value operand
 */
function filterHandlebarsHelper(...args: any[]): boolean {
  const [
    options,
    source,
    property,
    operator,
    value,
  ] = assertHandlebarsArguments<
    [
      HelperOptions,
      string,
      string,
      ConditionalFilterOperator,
      string | undefined
    ]
  >(args, "source", "property", "operator");

  const variableHandler = getHandlebarsVariableHandler(options);

  let input;
  if (source === "profile") {
    input = variableHandler.getRoot().getScoped("profile").resolveV2(property);
  } else {
    input = variableHandler.resolveV2(property);
  }

  return filterOperationWithTypeMatch(input, operator, value);
}

export default filterHandlebarsHelper;
