import { JSONObject } from "~/types.api";

const parseJsonObject = <T = JSONObject>(
  input: string | object | JSONObject | undefined
): T | undefined | null => {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as T;
    } catch {
      // use null as sentinel value
      return null;
    }
  }
  return (input as unknown) as T;
};

export default parseJsonObject;
