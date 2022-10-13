import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{abs -1)}}
 *
 * should:
 *   - return the absolute value for an input value
 *   - throw if it encounters a value that is not a number
 */
function abs(input: number) {
  assertIsNumber(input);
  return Math.abs(input);
}

export default abs;
