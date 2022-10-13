import variablePattern from "~/lib/variable-pattern";
import getHandlebarsParameter from "./get-handlebars-parameter";
import getHandlebarsText from "./get-handlebars-text";

/**
 * Take a string, search and replace variables, and format for use as text
 * content (ex: link text).
 */
const getComplexHandlebarsText = (
  text: string,
  options?: { lineReturn?: string; plain?: boolean; unsafe?: boolean }
): string => {
  let isVariable = true;

  return (
    text
      // split using a regex with groups will give us variables in every odd
      // index of the resulting array
      .split(variablePattern)
      .reduce((result, value) => {
        // toggle the isVariable flag
        isVariable = !isVariable;

        if (!isVariable) {
          // unsafe allows us to use hbs resolution in text without concat
          if (options?.unsafe) {
            return result + value;
          }

          return result + getHandlebarsText(value, options);
        }

        if (options?.plain) {
          return result + `{{{var ${getHandlebarsParameter(value)}}}}`;
        }

        return result + `{{inline-var ${getHandlebarsParameter(value)}}}`;
      }, "")
  );
};

export default getComplexHandlebarsText;
