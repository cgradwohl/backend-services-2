import Ajv, { ErrorObject } from "ajv";
import extendKeywords from "ajv-keywords";
import ajvFormats from "ajv-formats";
import betterAjvErrors from "better-ajv-errors";

const ajv = new Ajv({ $data: true });
ajvFormats(ajv);

// extend ajv to support keywords:
// https://github.com/ajv-validator/ajv-keywords
extendKeywords(ajv);

export default ajv;

export function extractErrors(schema: any, data: any, errors: ErrorObject[]) {
  const betterErrors = betterAjvErrors(schema, data, errors, { format: "js" });

  if (!betterErrors) {
    return [];
  }

  return betterErrors.map((error) => ({
    error: error.error,
    // @ts-ignore: path _does_ exist. type is incorrect
    path: error.path,
  }));
}
