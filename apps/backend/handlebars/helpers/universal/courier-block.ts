import { Exception, HelperOptions, SafeString } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";
import getHandlebarsLinkHandler from "../utils/get-link-handler";
import getRootHandlebarsData from "../utils/get-root-data";

/**
 * usage: {{#courier-block "abc-my-block-id-234"}}content{{/courier-block}}
 *
 * should:
 *   - add the block id to the link context
 *   - if a blockHandler fn in `data`, call with the block content and use the
 *     response as the content
 *   - ignore blocks that result in only whitespace (block.trim() === "")
 *   - return the content as a SafeString
 */
function courierBlockHandlebarsHelper(this: any, ...args) {
  const [options, blockId] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "blockId"
  );

  const data = getHandlebarsData(options);

  if (!blockId) {
    throw new Exception("#courier-block: missing block id");
  }

  const linkHandler = getHandlebarsLinkHandler(options);

  const content = String(
    options.fn(this, {
      data: {
        ...data,
        linkHandler: linkHandler.getScopedHandler(blockId),
      },
    })
  );

  // filter the unused blocks
  if (!content) {
    return content;
  }

  // get the root data
  const root = getRootHandlebarsData(data);

  // get the block index and increment
  const { blockIndex = 0, blockSeparator = "" } = root;
  root.blockIndex = blockIndex + 1;

  if (blockIndex !== 0) {
    return new SafeString(blockSeparator + content);
  }

  return new SafeString(content);
}

export default courierBlockHandlebarsHelper;
