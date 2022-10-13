import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#slack-text-block}}content{{/slack-text-block}}
 *
 * should:
 *  - register a text block
 *  - return a null string
 */
function slackTextBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  let text = String(options.fn(this));
  const { blockHandler, textStyle } = getHandlebarsData(options);

  if (!text) {
    return "";
  }

  if (textStyle === "h1") {
    blockHandler({
      text: {
        text,
        type: "plain_text",
      },
      type: "header",
    });

    return "";
  }

  blockHandler({
    text: {
      text,
      type: "mrkdwn",
    },
    type: "section",
  });

  return "";
}

export default slackTextBlockHandlebarsHelper;
