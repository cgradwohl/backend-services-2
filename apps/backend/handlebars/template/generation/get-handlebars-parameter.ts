import getEscapedHandlebarsString from "./get-escaped-handlebars-string";
import { isSafeParameterValue } from "./safe-parameter-value";

const getHandlebarsParameter = (value: any): string => {
  if (value === undefined) {
    return "undefined";
  }

  // primative?
  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      return getEscapedHandlebarsString(value);
    }

    return JSON.stringify(value);
  }

  if (isSafeParameterValue(value)) {
    return value.value;
  }

  // complex (object, array)
  // handlebars doesn't allow inline array/object notation... but it supports
  // strings with array/objects in JSON form. Combine this with a `json-parse`
  // helper and we're golden.
  return `(json-parse ${getEscapedHandlebarsString(JSON.stringify(value))})`;
};

export default getHandlebarsParameter;
