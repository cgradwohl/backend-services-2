import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { decode, encode } from "~/lib/base64";

interface ISearchKey {
  shard?: number;
  lastEvaluatedKey?: DocumentClient.Key;
}

type TransformRequestFn = (cursor: string) => ISearchKey;

export const transformRequest: TransformRequestFn = (cursor) => {
  if (!cursor || !cursor.trim()) {
    return null;
  }

  return JSON.parse(decode(cursor));
};

type TransformResponseFn = (searchKey: ISearchKey) => string;

export const transformResponse: TransformResponseFn = (searchKey) => {
  if (!searchKey) {
    return null;
  }

  return encode(JSON.stringify(searchKey));
};
