import assertIsNumber from "~/lib/assertions/is-number";

/**
 * usage: {{round 1.35)}}
 *
 * should:
 *   - return the input value rounded to the nearest integer
 *   - throw if it encounters a value that is not a number
 */
function round(input: number) {
  assertIsNumber(input);
  return Math.round(input);
}

export default round;
