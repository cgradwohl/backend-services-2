import { Exception, HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#if (condition "a" "!=" "b")}}
 *
 * should:
 *   - throw if the operator is unsupported
 *   - require two operands separated by an operator
 *   - run the appropriate operation on the operands
 */
function conditionHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [, a, conditional, b] = assertHandlebarsArguments<
    [HelperOptions, any, string, any]
  >(args, "operand1", "conditional", "operand2");

  switch (conditional) {
    case "==": // should we support non-strict?
    case "===":
      return a === b;
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "!=": // should we support non-strict?
    case "!==":
      return a !== b;
    default:
      throw new Exception(
        `#condition encountered unexpected conditional [${conditional}]`
      );
  }
}

export default conditionHandlebarsHelper;
