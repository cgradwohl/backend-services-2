import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{add 8 3)}}
 *
 * should:
 *   - return the result of adding two numbers together
 *   - throw if it encounters an input that is not a number
 */
function add(a: number, b: number) {
  assertIsNumber(a);
  assertIsNumber(b);
  return a + b;
}

export default add;
