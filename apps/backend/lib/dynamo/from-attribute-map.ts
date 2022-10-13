import { AttributeMap } from "aws-sdk/clients/dynamodb";

export default <T>(obj: AttributeMap): T => {
  let json = obj.json as T;

  try {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
  } catch {
    // do nothing
  }

  return ({
    ...obj,
    json,
  } as unknown) as T;
};
