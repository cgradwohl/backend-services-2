import { HelperOptions, SafeString } from "handlebars";
import juice from "juice";
import marked from "marked";
import sanitizeHtml from "sanitize-html";

import markdownTags from "../utils/markdown-tags";

/**
 * usage: {{#markdown}}I'm **markdown**!{{/markdown}}
 *
 * should:
 *   - render the markdown to HTML
 *   - should return a SafeString because it will contain html tags
 */
function emailMarkdownHandlebarsHelper(this: any, ...args: any[]) {
  const options: HelperOptions = args.pop();
  const markdown = options.fn(this) ?? "";

  const html = marked(markdown);
  const safeHtml = sanitizeHtml(html, { allowedTags: markdownTags });

  const sanitizedJuicedHtml = juice(`
    <style>
      th {
        padding-right: 12px;
        text-align: left;
      }
      td {
        padding-right: 12px;
        padding-bottom: 12px;
      }
    </style>
    ${safeHtml}
  `);

  // TODO: link discovery

  return new SafeString(sanitizedJuicedHtml);
}

export default emailMarkdownHandlebarsHelper;
