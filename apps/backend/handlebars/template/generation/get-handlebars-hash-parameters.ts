import getHandlebarsParameter from "./get-handlebars-parameter";

const unsafeKeyCharacter = /[\s!"#%&'()*+,./;<=>@[\]^`{|}~\[\]]/g;

// we are going to have to keep keys handlebars-hash-parameter compatible
// as long as we stick to normal camel, kebob, or snake case keys we will
// be fine.
const getSafeKey = (key: string): string => {
  return key.replace(unsafeKeyCharacter, "");
};

const getHandlebarsHashParameters = (data?: { [key: string]: any }): string => {
  if (!data) {
    return "";
  }

  const parameters = Object.keys(data)
    .sort() // for diffing templates
    .map((unsafeKey) => {
      const value = data[unsafeKey];
      const key = getSafeKey(unsafeKey);

      if (!key || value === undefined) {
        return "";
      }

      return ` ${key}=${getHandlebarsParameter(value)}`;
    })
    .filter((value) => value !== "")
    .join("");

  return parameters;
};

export default getHandlebarsHashParameters;
