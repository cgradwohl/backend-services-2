import { HelperOptions, SafeString } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#prerender "prerenderedText"}}{{> @partial-block }}{{/prerender}}
 *
 * should:
 *   - render the block content
 *   - store the rendered block content as a data on the current context
 *   - restrict the allowed params to ones that start with "prerendered"
 *   - return a null string so no content is rendered
 *
 * Pre-render a handlebars block and store the result in a data prop. This
 * allows you to have conditions around whether or not there was any text
 * in the handlebars block.
 * @param param - data prop key to use (must start with "prerendered")
 */
function prerenderHandlebarsHelper(...args) {
  const [options, param = "prerendered"] = assertHandlebarsArguments<
    [HelperOptions, string | undefined]
  >(args, "param");
  const data = getHandlebarsData(options);

  // for safety, make sure we only allow keys that start with prerendered
  // because we don't want customers to be able to screw up data props if
  // they learn about/start using this helper
  if (param.substr(0, 11) === "prerendered") {
    const prerendered = String(options.fn(this));
    data[param] = prerendered.trim() === "" ? "" : prerendered;
  }

  return "";
}

export default prerenderHandlebarsHelper;
