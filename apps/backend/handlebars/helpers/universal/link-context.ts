import { HelperOptions, SafeString } from "handlebars";

import { ILinkHandler } from "~/lib/link-handler";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsLinkHandler from "../utils/get-link-handler";

/**
 * usage: {{#link-context "rich-text"}}partial content{{/link-context}}
 *
 * should:
 *   - scope all links within using the new context
 */
function linkContextHandlebarsHelper(this: any, ...args) {
  const [options, ...contexts] = assertHandlebarsArguments<
    [HelperOptions, string | number]
  >(args, "linkContext");

  const data = {
    ...options.data,
  };

  const linkHandler = getHandlebarsLinkHandler(options);

  const scopedLinkHandler = contexts.reduce(
    (lh: ILinkHandler, context: string | number) => {
      return lh.getScopedHandler(context);
    },
    linkHandler
  );

  return new SafeString(
    options.fn(this, {
      data: {
        ...data,
        linkHandler: scopedLinkHandler,
      },
    })
  );
}

export default linkContextHandlebarsHelper;
