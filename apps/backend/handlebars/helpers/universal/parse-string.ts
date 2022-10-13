import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{block (params myText=(parse-string "\n"))}}
 *
 * When generating a template, any strings that contain escape sequences will
 * be wrapped in this helper. The usage example above will give this helper a
 * string containing two characters ("\" and "n") instead of the expected single
 * line return character ("\n"). This will properly convert it back to the line
 * return character.
 */
function parseStringHandlebarsHelper(...args) {
  const [, str] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "string"
  );

  // we know that handlebars only handles escaped single and double quotes and
  // we know that JSON.stringify() will only escape double quotes. So we only
  // need to re-escape the double quotes and wrap the whole string in double
  // quotes to get a valid JSON string
  const jsonString = `"${str.replace(/"/g, '\\"')}"`;

  // now we can parse the JSON string
  return JSON.parse(jsonString);
}

export default parseStringHandlebarsHelper;
