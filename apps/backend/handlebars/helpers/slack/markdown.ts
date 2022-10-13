import { HelperOptions, SafeString } from "handlebars";
import { replaceMarkdownLinks } from "~/components/lib/replace-markdown-links";
import { ILinkOptions } from "~/lib/link-handler";
import slackifyMarkdown from "~/lib/slackify-markdown";
import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsLinkHandler from "../utils/get-link-handler";

/**
 * usage: {{#markdown}}I'm **markdown**!{{/markdown}}
 *
 * should:
 *   - render the markdown to Slack format
 *   - should return a SafeString
 */
function slackMarkdownHandlebarsHelper(this: any, ...args: any[]) {
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const { context } = options.hash;
  const markdown = options.fn(this);
  const markdownWithTrackingLinks = replaceMarkdownLinks(
    markdown,
    (href: string, text: string) => {
      const linkHandler = getHandlebarsLinkHandler(options);
      const linkOptions: ILinkOptions = {
        href,
        // add text if exists
        ...(text && { text }),
      };
      return linkHandler.handleHref(linkOptions, context);
    }
  );
  const slackMarkdown = slackifyMarkdown(markdownWithTrackingLinks);
  return new SafeString(slackMarkdown);
}

export default slackMarkdownHandlebarsHelper;
