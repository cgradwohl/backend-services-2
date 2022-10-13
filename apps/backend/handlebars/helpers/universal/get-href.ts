import { HelperOptions } from "handlebars";

import { ILinkHandler, ILinkOptions } from "~/lib/link-handler";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsLinkHandler from "../utils/get-link-handler";

/**
 * usage: <a href="{{get-href "https://example.com" context="image-link" text="go to example.com"}}">go to example.com</a>
 *
 * should:
 *   - register the href value at the context with any additional link data (text)
 *   - return the trackingHref
 */
function getHrefHandlebarsHelper(...args) {
  const [options, href] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "href"
  );

  const { context, text, disableLinkTracking, TODO_REMOVE_ME } = options.hash;

  if (!href) {
    return "";
  }

  if (disableLinkTracking) {
    return href;
  }

  const linkOptions: ILinkOptions = {
    href,
  };

  if (text) {
    linkOptions.text = text;
  }

  const linkHandler = getHandlebarsLinkHandler(options);
  const trackingHref = linkHandler.handleHref(linkOptions, context);

  if (TODO_REMOVE_ME) {
    return "";
  }

  return trackingHref;
}

export default getHrefHandlebarsHelper;
