import { DynamoDB } from "aws-sdk";

export default function dynamoToJson<T>(record: any): T {
  const item = DynamoDB.Converter.unmarshall(record) as T;

  try {
    const itemJson = (item as any).json;
    if (itemJson && typeof itemJson === "string") {
      (item as any).json = JSON.parse(itemJson);
    }
  } catch {
    // do nothing
  }

  return item;
}
