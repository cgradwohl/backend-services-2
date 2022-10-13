import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{a-block (params text=(trim-one-char-right "ends with\ "))}}
 *
 * should:
 *   - return the string with the last character removed
 *
 * This helper is for dealing with the following escaping issue:
 * https://github.com/handlebars-lang/handlebars.js/issues/1159
 */
function trimOneCharRightHandlebarsHelper(...args) {
  const [, text] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "text"
  );

  return text.substr(0, text.length - 1);
}

export default trimOneCharRightHandlebarsHelper;
