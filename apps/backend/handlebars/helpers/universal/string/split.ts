function assertString(input: string): asserts input is string {
  if (typeof input !== "string") {
    throw new TypeError(`${input}:${typeof input} is not a string`);
  }
}

/**
 * usage: {{split "try courier")}} => ["try", "courier"]
 * usage: {{split "try|courier" "|")}} => ["try", "courier"]
 * usage: {{split "courier")}} => ["courier"]
 *
 * should:
 *   - split a string given an optional delimeter
 */
function splitHandlebarsHelper(
  value: string,
  delimeter: string = ""
): string[] {
  assertString(value);
  assertString(delimeter);
  return String(value).split(delimeter);
}

export default splitHandlebarsHelper;
