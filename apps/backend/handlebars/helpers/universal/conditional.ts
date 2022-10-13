import { HelperOptions } from "handlebars";

/**
 * usage: {{conditional (filter "data" "customer.name" "EQUALS" "josh") (filter "profile" "email" "CONTAINS" "@courier.com")}}
 *
 * should:
 *   - loop through all arguments and ensure all are truthy if using the "and" logical operator
 *   - loop through all arguments and ensure one is truthy if using the "or" logical operator
 *   - return true if the conditions passed, false otherwise (use #unless helper to hide content if condition passes)
 */
function conditionalHandlebarsHelper(this: any, ...args) {
  const options: HelperOptions = args.pop();
  const { logicalOperator = "and", behavior = "hide" } = options.hash;

  const arrayFn = logicalOperator === "or" ? "some" : "every";

  const conditionalResult = args[arrayFn](Boolean);

  if (behavior === "show") {
    return conditionalResult ? options.fn(this) : options.inverse(this);
  }

  return conditionalResult ? options.inverse(this) : options.fn(this);
}

export default conditionalHandlebarsHelper;