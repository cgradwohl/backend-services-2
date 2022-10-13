import { HelperOptions, SafeString } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import { CourierParams } from "./params";

/**
 * usage: {{#courier-partial}}partial content{{/courier-partial}}
 *
 * should:
 *   - look for the CourierParams symbol in the context
 *   - spread the CourierParams object into the data
 *   - use the context (minus the CourierParams property) and data to render the nested content
 *   - return the content as a SafeString because we expect Handlebars content in the block
 */
function courierPartialHandlebarsHelper(this: any, ...args) {
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const { [CourierParams]: params = {}, ...context } = this;

  const data = {
    ...options.data,
    ...params,
    _parent: options.data._parent, // just to make sure we never overwrite. Needed for ../ handlebars syntax
  };

  return new SafeString(options.fn(context, { data }));
}

export default courierPartialHandlebarsHelper;
