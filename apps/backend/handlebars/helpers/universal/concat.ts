import { SafeString } from "handlebars";

/**
 * usage: {{concat "hello" "world"}}
 *
 * should:
 *   - stringify all arguments and join them using the provided separator
 *   - should use null string for the separator by default
 *   - should return a null string if no arguments
 */
function concatHandlebarsHelper(...args) {
  const {
    hash: { safe = false, separator = "" },
  } = args.pop();

  const text = `${args.join(separator)}`;

  return safe ? new SafeString(text) : text;
}

export default concatHandlebarsHelper;
