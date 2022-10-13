import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{multiply 8 3)}}
 *
 * should:
 *   - return the result of multiply two numbers together
 *   - throw if it encounters an input that is not a number
 */
function multiply(a: number, b: number) {
  assertIsNumber(a);
  assertIsNumber(b);
  return a * b;
}

export default multiply;
