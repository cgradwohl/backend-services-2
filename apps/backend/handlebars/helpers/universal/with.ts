import { HelperOptions, Utils } from "handlebars";
import createVariableHandler, {
  IVariableHandler,
} from "~/lib/variable-handler";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{with customers}}
 *
 * should:
 *   - match the Handlebars built-in #with helper
 *   - set the @variableHandler scope when rendering the block content
 *
 * note: modified version of https://github.com/handlebars-lang/handlebars.js/blob/212f9d930b1a39599da2646ac23da64f6552b9d0/lib/handlebars/helpers/with.js
 */
function withHandlebarsHelper(...args) {
  const [options, ...safeArgs] = assertHandlebarsArguments<
    [HelperOptions, any]
  >(args, "context");
  let [context] = safeArgs;

  if (typeof context === "function") {
    context = context.call(this);
  }

  if (Utils.isEmpty(context)) {
    // render else block
    return options.inverse(this);
  }

  const parent =
    options.data && options.data.variableHandler
      ? (options.data.variableHandler as IVariableHandler).getContext()
      : undefined;

  // need a variable handler scoped to this new context
  const data = {
    ...options.data,
    variableHandler: createVariableHandler({ parent, value: context }),
  };

  return options.fn(context, { data, blockParams: [context] });
}

export default withHandlebarsHelper;
