import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{subtract 8 3)}}
 *
 * should:
 *   - return the result of subtracting one number from another
 *   - throw if it encounters an input that is not a number
 */
function subtract(a: number, b: number) {
  assertIsNumber(a);
  assertIsNumber(b);
  return a - b;
}

export default subtract;
