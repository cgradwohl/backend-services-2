import { Exception, HelperOptions, Utils } from "handlebars";

import createVariableHandler, {
  IVariableHandler,
} from "~/lib/variable-handler";

/**
 * usage: {{each ["a", "b", "c"] as |char|}}
 *
 * should:
 *   - match the Handlebars built-in #each helper
 *   - set the @variableHandler scope when rendering each element
 *
 * note: modified version of https://github.com/handlebars-lang/handlebars.js/blob/212f9d930b1a39599da2646ac23da64f6552b9d0/lib/handlebars/helpers/each.js
 */
function eachHandlebarsHelper(context: any, options: HelperOptions) {
  if (!options) {
    throw new Exception("Must pass iterator to #each");
  }

  const { fn, inverse } = options;
  let data: any;
  let ret: string = "";
  let i: number = 0;

  const parent =
    options.data && options.data.variableHandler
      ? (options.data.variableHandler as IVariableHandler).getContext()
      : undefined;

  if (Utils.isFunction(context)) {
    context = context.call(this);
  }

  if (options.data) {
    data = Utils.createFrame(options.data);
  }

  const execIteration = (
    field: string | number,
    index: number,
    last: boolean = false
  ) => {
    const iterationContext = context[field];

    if (data) {
      data.key = field;
      data.index = index;
      data.first = index === 0;
      data.last = last;
      data.variableHandler = createVariableHandler({
        parent,
        value: iterationContext,
      });
    }

    ret =
      ret +
      fn(iterationContext, {
        blockParams: [iterationContext, field],
        data,
      });
  };

  if (context && typeof context === "object") {
    if (Utils.isArray(context)) {
      const last = context.length - 1;
      for (; i <= last; i++) {
        if (i in context) {
          execIteration(i, i, i === last);
        }
      }
    } else if (context[Symbol.iterator]) {
      const newContext = [];
      const iterator = context[Symbol.iterator]();

      for (let it = iterator.next(); !it.done; it = iterator.next()) {
        newContext.push(it.value);
      }

      context = newContext;

      const last = context.length - 1;
      for (; i <= last; i++) {
        execIteration(i, i, i === last);
      }
    } else {
      const keys = Object.keys(context);
      const last = keys.length - 1;

      keys.forEach(key => {
        execIteration(key, i, i === last);
        i++;
      });
    }
  }

  // didn't iterate over anything?
  if (i === 0) {
    // render else block
    ret = inverse(this);
  }

  return ret;
}

export default eachHandlebarsHelper;
