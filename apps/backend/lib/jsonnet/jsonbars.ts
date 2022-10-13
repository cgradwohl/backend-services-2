import Jsonnet from "~/lib/jsonnet";
import handlebars from "handlebars";
import courierHandlebarsHelpers from "~/handlebars/helpers";
import slackifyHelper from "~/handlebars/helpers/slack/markdown";

import makeError from "make-error";

export const HandlebarsEvalError = makeError("HandlebarsEvalError");

// instance jsonnet
const jsonnet = new Jsonnet();
function jsonEscape(str) {
  return (
    str

      // C-2173/debug-expel-slacify-json-parsing-issue
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
  );
}

export default ({ snippet, data, variableHandler }) => {
  const evaluated = jsonnet.eval(snippet);

  const handlebarsTemplateOptions = {
    data: {
      variableHandler,
    },
    helpers: {
      slackifyMd: slackifyHelper,
      ...courierHandlebarsHelpers.universal,
    },
  };

  try {
    const compiledTemplate = handlebars.compile(JSON.stringify(evaluated));
    const jsonString = compiledTemplate(data, handlebarsTemplateOptions);
    return JSON.parse(jsonEscape(jsonString));
  } catch (ex) {
    throw new HandlebarsEvalError(ex);
  }
};
