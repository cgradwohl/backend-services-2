import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#slack-action-block actionId=(get-action-id @actionId context="action" text=@prerenderedText)}}{{{@prerenderedText}}}{{/slack-action-block}}
 *
 * should:
 *  - register an action block
 *  - return a null string
 */
function slackTextBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const text = String(options.fn(this));
  const { blockHandler } = getHandlebarsData(options);
  const { actionId, url } = options.hash;

  blockHandler({
    elements: [
      {
        action_id: actionId,
        text: {
          emoji: true,
          text,
          type: "plain_text",
        },
        type: "button",
        url,
      },
    ],
    type: "actions",
  });

  return "";
}

export default slackTextBlockHandlebarsHelper;
