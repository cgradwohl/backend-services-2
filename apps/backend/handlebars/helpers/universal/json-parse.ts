import { Exception } from "handlebars";

/**
 * usage: {{text-block (params data=(json-parse "{ \"anInlineObject\": true }"))}}
 *
 * should:
 *   - parse a JSON string and return the result
 *   - throw if it encounters an parse error
 */
function jsonParseHandlebarsHelper(value: string) {
  if (typeof value !== "string") {
    throw new Exception("#json-parse expects a string argument to parse");
  }

  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Exception("#json-parse failed:" + err.message);
  }
}

export default jsonParseHandlebarsHelper;
