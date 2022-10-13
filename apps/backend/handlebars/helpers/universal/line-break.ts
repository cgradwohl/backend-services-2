import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{lineBreak}}
 *
 * should:
 *   - return lineBreak for channel
 */
function lineBreakHandlebarsHelper(...args) {
  const [options] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "path"
  );

  const { lineReturn } = getHandlebarsData(options);
  return lineReturn;
}

export default lineBreakHandlebarsHelper;
