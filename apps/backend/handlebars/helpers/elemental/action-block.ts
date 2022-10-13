import {
  ElementalActionNode,
  ElementalNode,
} from "./../../../api/send/types/courier-elemental";
import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";

/**
 * usage: {{#elemental-action-block}}{{{@prerenderedText}}}{{/elemental-action-block}}
 *
 * should:
 *  - register an action block
 *  - return a null string
 */
function actionBlockHandlebarsHelper(...args) {
  // require operand, condition operator, and operand in that order
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  const content = String(options.fn(this));
  const { href, style, align, backgroundColor } = options.hash;

  const {
    elementalHandler,
  }: {
    elementalHandler: (element: ElementalNode) => void;
  } = getHandlebarsData(options);

  const actionElemental: ElementalActionNode = {
    content,
    href,
    background_color: backgroundColor,
    type: "action",
  };

  if (style !== "button") {
    actionElemental.style = style;
  }

  if (align !== "center") {
    actionElemental.align = align;
  }

  elementalHandler(actionElemental);

  return "";
}

export default actionBlockHandlebarsHelper;
