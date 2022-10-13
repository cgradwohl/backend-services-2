import { sprintf } from "sprintf-js";

/**
 * usage: {{format "%.2f" "100")}} => "100.00"
 *
 * should:
 *   - return a formatted string given a format and set of arguments
 */
function helper(fmt: string, input: string | string[]) {
  const args = Array.isArray(input) ? input : [input];
  return sprintf(fmt, ...args);
}

export default helper;
