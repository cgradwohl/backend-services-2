import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#in-app-text-block}}content{{/in-app-text-block}}
 *
 * should:
 *  - register a text block
 *  - return a null string
 */
function textBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  let text = String(options.fn(this));
  const { blockHandler } = getHandlebarsData(options);

  if (!text) {
    return "";
  }

  blockHandler({
    text,
    type: "text",
  });

  return "";
}

export default textBlockHandlebarsHelper;
