import { HelperOptions } from "handlebars";

import { ILinkHandler, IWebhookOptions } from "~/lib/link-handler";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsLinkHandler from "../utils/get-link-handler";

/**
 * usage: {{get-action-id "my-action-id" context="action" text="click here"}}
 *
 * should:
 *   - register the actionId at the context with any additional webhook data
 *   - return the trackingId
 */
function getActionIdHandlebarsHelper(...args) {
  const [options, actionId] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args);

  const { context, text } = options.hash;

  const linkOptions: IWebhookOptions = {
    actionId,
    isWebhook: true,
  };

  if (text) {
    linkOptions.text = text;
  }

  const linkHandler = getHandlebarsLinkHandler(options);
  const trackingId = linkHandler.handleWebhook(linkOptions, context);

  return trackingId;
}

export default getActionIdHandlebarsHelper;
