import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#in-app-action-block}}{{{@prerenderedText}}}{{/in-app-action-block}}
 *
 * should:
 *  - register an action block
 *  - return a null string
 */
function actionBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const text = String(options.fn(this));
  const { blockHandler } = getHandlebarsData(options);
  const { url } = options.hash;

  blockHandler({
    text,
    url,
    type: "action",
  });

  return "";
}

export default actionBlockHandlebarsHelper;
