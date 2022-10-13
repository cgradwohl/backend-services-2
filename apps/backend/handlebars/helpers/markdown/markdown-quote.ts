import { HelperOptions } from "handlebars";
import assertHandlebarsArguments from "../utils/assert-arguments";

/**
 * usage: {{#markdown-quote}}content{{/markdown-quote}}
 *
 * should:
 *  - split text on newlines and append > to each line
 */
function quoteHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  let text = String(options.fn(this));

  if (!text) {
    return "";
  }

  text = text
    .split("\n")
    .map((line) => {
      return `> ${line}`;
    })
    .join("\n");

  return text;
}

export default quoteHelper;
