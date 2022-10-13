import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { decode, encode } from "~/lib/base64";

type TransformRequestFn = (cursor: string) => DocumentClient.Key;
export const transformRequest: TransformRequestFn = (cursor) => {
  if (!cursor || !cursor.trim()) {
    return null;
  }

  return JSON.parse(decode(cursor));
};

type TransformResponseFn = (lastEvaluatedKey: DocumentClient.Key) => string;
export const transformResponse: TransformResponseFn = (lastEvaluatedKey) => {
  if (!lastEvaluatedKey) {
    return null;
  }

  return encode(JSON.stringify(lastEvaluatedKey));
};
