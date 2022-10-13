import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#slack-divider-block}}
 *
 * should:
 *  - return a divider block
 *  - return a null string
 */
function slackDividerBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions, string]>(args);
  const { blockHandler } = getHandlebarsData(options);

  blockHandler({
    type: "divider",
  });

  return "";
}

export default slackDividerBlockHandlebarsHelper;
