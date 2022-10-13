import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { decode, encode } from "~/lib/base64";
import { query } from "~/lib/dynamo";

interface ISearchKey {
  shard?: number;
  lastEvaluatedKey?: DocumentClient.Key;
}

export interface IPagination {
  cursor: string;
  more: boolean;
}

type TransformRequestFn = (cursor: string) => ISearchKey;

const transformRequest: TransformRequestFn = (cursor) => {
  if (!cursor || !cursor.trim()) {
    return null;
  }

  return JSON.parse(decode(cursor));
};

type TransformResponseFn = (searchKey: ISearchKey) => string;

const transformResponse: TransformResponseFn = (searchKey) => {
  if (!searchKey) {
    return null;
  }

  return encode(JSON.stringify(searchKey));
};

/*
  This function allows you to paginate through a set of shards.
  The curser returned by this function is a decoded form that combines of the most recently iterated shard number and the last evaluated if any (for the current shard).
*/
export async function paginateAcrossShards<T>(
  pageSize: number = 100,
  queryFn: (
    currentShard: number,
    currentLastEvaluatedKey: DocumentClient.Key,
    limit: number
  ) => ReturnType<typeof query>,
  shardRange: number = 10,
  cursor?: string
): Promise<{ items: T[]; paging: IPagination }> {
  const searchKey = transformRequest(cursor);

  let currentShard = searchKey?.shard ?? 1;
  let currentLastEvaluatedKey = searchKey?.lastEvaluatedKey;

  let limit = pageSize;

  const retrievedItems: T[] = [];

  while (limit > 0) {
    const { Count: totalDocuments, Items: items } = await queryFn(
      currentShard,
      currentLastEvaluatedKey,
      limit + 1
    );
    if (totalDocuments <= limit) {
      currentLastEvaluatedKey = undefined;
      if (currentShard === shardRange) {
        limit = 0;
      } else {
        currentShard++;
        limit = limit - totalDocuments;
      }
    } else {
      limit = 0;
      items.pop();
      const last = items[items.length - 1];
      currentLastEvaluatedKey = {
        gsi1pk: last.gsi1pk,
        pk: last.pk,
      };
    }
    retrievedItems.push(...(items as T[]));
  }

  let nextCursor = null;
  let more: boolean = true;

  if (currentShard === shardRange && currentLastEvaluatedKey === undefined) {
    more = false;
  } else {
    nextCursor = transformResponse({
      shard: currentShard,
      lastEvaluatedKey: currentLastEvaluatedKey,
    });
  }

  return {
    items: retrievedItems,
    paging: {
      cursor: nextCursor,
      more,
    },
  };
}
