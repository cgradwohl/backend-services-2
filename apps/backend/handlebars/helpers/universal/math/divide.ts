import { Exception } from "handlebars";
import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{divide 8 4)}}
 *
 * should:
 *   - return the result of dividing one number by another
 *   - throw if it encounters an input that is not a number
 */
function divide(a: number, b: number) {
  assertIsNumber(a);
  assertIsNumber(b);

  if (b === 0) {
    throw new Exception("Cannot divide by zero");
  }

  return a / b;
}

export default divide;
