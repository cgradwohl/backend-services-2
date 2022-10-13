import { BadRequest } from "~/lib/http-errors";
import parseJsonObject from "~/lib/parse-json-object";

/** Asserts the supplied field exists on the request body, is a valid JSON string or object, and returns the object */
export const assertOptionalJsonField = <
  T extends Record<string, any>,
  U extends keyof T
>(
  body: T,
  field: U
): T[U] | undefined => {
  const prop = body[field];

  if (prop === undefined || prop === null) {
    return;
  }

  const value = parseJsonObject(prop);
  if (value === null || typeof value !== "object") {
    const name = String(field);
    throw new BadRequest(
      `Invalid definition for property '${name}'. The '${name}' property must be either a valid JSON object or stringified JSON.`
    );
  }

  return value as unknown as T[U];
};
