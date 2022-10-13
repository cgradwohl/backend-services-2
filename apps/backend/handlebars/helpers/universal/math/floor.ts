import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{floor 1.35)}}
 *
 * should:
 *   - return the input value rounded down to the next largest integer
 *   - throw if it encounters a value that is not a number
 */
function floor(input: number) {
  assertIsNumber(input);
  return Math.floor(input);
}

export default floor;
