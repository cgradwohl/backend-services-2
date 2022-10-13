import { HelperOptions, SafeString } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#markdown-mark "_"}}
 *
 * should:
 *  - should wrap the trimmed content with the mark
 *  - should include any whitespace before or after the mark
 */
function markdownMarkHandlebarsHelper(...args) {
  const [options, mark] = assertHandlebarsArguments<[HelperOptions, string]>(
    args,
    "mark"
  );

  const content = options.fn(this);
  const trimmed = content.trim();

  if (!content || !trimmed) {
    return content;
  }

  return content.replace(trimmed, mark + trimmed + mark);
}

export default markdownMarkHandlebarsHelper;
