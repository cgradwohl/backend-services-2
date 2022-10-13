import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{ceil 1.35)}}
 *
 * should:
 *   - return the input value rounded up to the next largest integer
 *   - throw if it encounters a value that is not a number
 */
function ceil(input: number) {
  assertIsNumber(input);
  return Math.ceil(input);
}

export default ceil;
