const getEscapedString = (value: string) => {
  // handlebars should've been able to handle normal JSON strings but it has a
  // very naive escaping where only " and ' are unescaped. This becomes a
  // problem when, for example, the string contains line returns ("\n"). We will
  // pass "\n" expecting to get a line return back out but will instead get a
  // literal backslash "\" and the character "n" back out. To fix this, I am
  // using a `parse-string` helper that will convert the value back to a JSON
  // string and do JSON.parse()
  const escaped = JSON.stringify(value);

  // no escaping done so we know it is safe?
  if (escaped === `"${value}"`) {
    return escaped;
  }

  // the string contains escaped characters (tabs, new lines, ', ", etc):
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#Escape_notation
  // use the `parse-string` helper to properly read these values back out.
  return `(parse-string ${escaped})`;
};

const getEscapedHandlebarsString = (value: string): string => {
  // to add to the fun, a string literal cannot end with a backslash:
  // https://github.com/handlebars-lang/handlebars.js/issues/1159
  // So if the string ends with a backslash, we wil pad with a space and wrap
  // with yet another helper that will later remove that space
  const trim = value.charAt(value.length - 1) === "\\";
  const escaped = getEscapedString(value + (trim ? " " : ""));

  if (trim) {
    return `(trim-one-char-right ${escaped})`;
  }

  return escaped;
};

export default getEscapedHandlebarsString;
