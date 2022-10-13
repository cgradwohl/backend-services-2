import { Exception } from "handlebars";
import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{mod 8 3)}}
 *
 * should:
 *   - return the remainder left over division
 *   - throw if it encounters a numerator that is not a number
 *   - throw if it encounters a operator that is not a number
 */
function mod(a: number, b: number) {
  assertIsNumber(a);
  assertIsNumber(b);

  if (b === 0) {
    throw new Exception("Cannot divide by zero");
  }

  return a % b;
}

export default mod;
