import {
  ElementalNode,
  ElementalTextNode,
} from "@trycourier/courier/lib/send/types";
import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#elemental-text-block}}content{{/elemental-text-block}}
 *
 * should:
 *  - register a text block
 *  - return a null string
 */
function textBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const content = String(options.fn(this));

  const {
    elementalHandler,
  }: {
    elementalHandler: (element: ElementalNode) => void;
  } = getHandlebarsData(options);

  if (!content) {
    return "";
  }

  const textElemental: ElementalTextNode = {
    content,
    type: "text",
  };

  elementalHandler(textElemental);

  return "";
}

export default textBlockHandlebarsHelper;
