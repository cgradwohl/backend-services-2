import getHandlebarsParameter from "./get-handlebars-parameter";

const unsafeCharacters = /[&<>"'`={}]/;

const getHandlebarsLine = (text: string, plain: boolean = false): string => {
  if (!unsafeCharacters.exec(text)) {
    // should be safe
    return text;
  }

  const plainOption = plain ? " safe=true" : "";

  // want `{{` to be rendered in plain text. There is a raw helper
  // but it doesn't work for all strings. But I found that string
  // primatives can contain handlebar sequences without being
  // processed so we can just use our concat helper to print the
  // unsafe string.
  return `{{concat ${getHandlebarsParameter(text)}${plainOption}}}`;
};

const getHandlebarsText = (
  text: string,
  {
    lineReturn = "{{>br}}",
    plain,
  }: { lineReturn?: string; plain?: boolean } = {}
): string => {
  // handle line returns
  const lines = text
    .split(/\r?\n/)
    .map((line) => getHandlebarsLine(line, plain));

  if (lines.length === 1) {
    return lines[0];
  }

  return lines.join(lineReturn);
};

export default getHandlebarsText;
