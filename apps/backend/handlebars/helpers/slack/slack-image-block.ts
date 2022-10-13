import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{slack-image-block @src alt=@alt href=(get-href @href context="image" text=@alt REMOVE_ME=true)}}
 *
 * should:
 *  - register a text block
 *  - return a null string
 */
function slackImageBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options, imageUrl] = assertHandlebarsArguments<
    [HelperOptions, string]
  >(args, "imageUrl");
  const { blockHandler } = getHandlebarsData(options);
  const { alt } = options.hash;

  blockHandler({
    alt_text: alt || " ", // slack requires alt text length > 0
    image_url: imageUrl,
    type: "image",
  });

  return "";
}

export default slackImageBlockHandlebarsHelper;
