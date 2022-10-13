import { HelperOptions } from "handlebars";

export const CourierParams = Symbol("courier-params");

/**
 * usage: {{>divider-block (params color="#FF9000")}}
 *
 * should:
 *   - take all the hash params and store them in the context using the CourierParams symbol as the key
 *   - return the new context for use in a partial
 */
function paramsHandlebarsHelper(this: any, ...args) {
  const options: HelperOptions = args.pop();

  const context = {
    ...this,
    // using a symbol ensures we will not overwite customer data
    [CourierParams]: options.hash,
  };

  return context;
}

export default paramsHandlebarsHelper;
