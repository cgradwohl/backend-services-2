import variablePattern from "~/lib/variable-pattern";

import getEscapedHandlebarsString from "./get-escaped-handlebars-string";
import safeParameterValue, {
  ISafeParameterValue,
} from "./safe-parameter-value";

/**
 * Take a string of text (from email subject ect) and convert it
 * to a handlebars parameter equivalent.
 */
const getComplexHandlebarsParameter = (text?: string): ISafeParameterValue => {
  if (text === undefined) {
    return undefined;
  }

  if (!text) {
    return safeParameterValue('""');
  }

  let isVariable = true;

  const values = text
    // split using a regex with groups will give us variables in every odd index of the
    // resulting array
    .split(variablePattern)
    .map((value) => {
      // toggle the isVariable flag
      isVariable = !isVariable;

      if (!isVariable) {
        return getEscapedHandlebarsString(value);
      }

      return `(var ${getEscapedHandlebarsString(value)})`;
    })
    .filter((value) => value !== '""');

  if (values.length === 1) {
    return safeParameterValue(values[0]);
  }

  return safeParameterValue(`(concat ${values.join(" ")})`);
};

export default getComplexHandlebarsParameter;
