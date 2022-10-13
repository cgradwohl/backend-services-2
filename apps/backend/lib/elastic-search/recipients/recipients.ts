import makeError from "make-error";
import { recipientMappingDefaultValues_2022_01_28 as strictRecipient } from "~/lib/sample-recipient-fields";
import { sortBy } from "~/studio/graphql/recipients-2022-01-28/data-source";
import { IRecipient, RecipientType } from "~/types.api";

import elasticSearch from "..";
import { EsResponse } from "../../../types.api";

export const BadCursor = makeError("BadCursor");

const elasticSearchEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const elasticSearchShards = process.env.ELASTIC_SEARCH_RECIPIENTS_SHARDS;
export const elasticSearchIndex = "recipients-2022-01-28";
const maxLimit = 50;
const timeJumpRecordsBefore = 15;

const es = elasticSearch(elasticSearchEndpoint, elasticSearchIndex);

// search after values are passed as a string as "<date number>,<record key>"
const getReversedSearchAfter = (value: string): [string, number, any?] => {
  const values = value.split(",").reverse();
  const reversedSearchAfter: [string, number, any?] = [
    values.slice(0).join(","),
    parseInt(values[1], 10),
  ];
  if (values[2]) {
    reversedSearchAfter.push(values[2]);
  }

  if (!reversedSearchAfter[0] || isNaN(reversedSearchAfter[1])) {
    throw new BadCursor();
  }

  return reversedSearchAfter;
};

const handleSearchRequest = async (
  request: any,
  limit: number,
  reversed: boolean = false
): Promise<EsResponse<IRecipient>> => {
  const { hits: esItems } = await es.search(request);

  let next: string;
  let prev: string;

  // if we received the extra item, build a next value that should be
  // sent back when getting the next page
  if (esItems.length === limit + 1) {
    // remove the additional item
    esItems.pop();

    const searchAfter = esItems[esItems.length - 1].sort.join(",");

    if (reversed) {
      prev = searchAfter;
    } else {
      next = searchAfter;
    }
  }

  const keys = Object.keys(strictRecipient);
  const items: IRecipient[] = esItems.map(({ _source: item }) => ({
    id: item.id,
    tenantId: item.tenantId,
    updated_at: item.updated_at,
    type: item.type,
    ...keys.reduce((acc, k) => {
      acc[k] = item[k];
      return acc;
    }, {}),
  }));

  if (reversed) {
    items.reverse();
  }

  return { items, next, prev };
};

export const setIndex = async () => {
  try {
    await es.deleteIndex();
  } catch (err) {
    // no worries if 404
    if (
      !err ||
      !err.response ||
      !err.response.status ||
      err.response.status !== 404
    ) {
      throw err;
    }
  }

  return es.setIndex({
    mappings: {
      properties: {
        address: {
          enabled: false,
          type: "object",
        },
        birthdate: {
          format: "date_optional_time",
          type: "date",
        },
        email: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        email_verified: {
          type: "boolean",
        },
        family_name: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        gender: {
          type: "keyword",
        },
        given_name: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        id: {
          type: "keyword",
        },
        last_sent_at: {
          format: "epoch_second",
          type: "date",
        },
        locale: {
          type: "keyword",
        },
        middle_name: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        name: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        nickname: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        phone_number: {
          type: "keyword",
        },
        phone_number_verified: {
          type: "boolean",
        },
        picture: {
          type: "keyword",
        },
        preferred_username: {
          type: "keyword",
        },
        profile: {
          type: "keyword",
        },
        recipientId: {
          type: "keyword",
          normalizer: "lowercase_normalizer",
        },
        sub: {
          type: "keyword",
        },
        tenantId: {
          type: "keyword",
        },
        type: {
          type: "keyword",
        },
        updated: {
          format: "epoch_millis",
          type: "date",
        },
        updated_at: {
          format: "epoch_millis",
          type: "date",
        },
        website: {
          type: "keyword",
        },
        zoneinfo: {
          type: "keyword",
        },
      },
    },
    settings: {
      number_of_replicas: 1,
      number_of_shards: elasticSearchShards,
      analysis: {
        normalizer: {
          lowercase_normalizer: {
            type: "custom",
            char_filter: [],
            filter: ["lowercase", "asciifolding"],
          },
        },
      },
    },
  });
};

export const search = async (args: {
  at?: string;
  before?: number;
  limit?: number;
  next?: string;
  prev?: string;
  text?: string;
  filterTypes?: RecipientType[];
  sortBy?: sortBy;
  start?: number;
  tenantId?: string;
}): Promise<EsResponse<IRecipient>> => {
  const {
    at: atToken,
    before: jumpToTimeBefore,
    limit: unsafeLimit = maxLimit,
    next: nextToken,
    prev: prevToken,
    start: jumpToTime,
    text,
    filterTypes,
    sortBy,
    tenantId,
  } = args;
  const filter: any[] = tenantId ? [{ term: { tenantId } }] : [];

  if (filterTypes?.length) {
    filter.push({ terms: { type: filterTypes } });
  }

  let limit = Math.min(unsafeLimit, maxLimit);
  let reversedSearchAfter: [string, number, any?] | undefined;
  let itemsBeforeJump: Promise<EsResponse<IRecipient>> = Promise.resolve({
    items: [],
  });
  let reversed = false;

  if (text) {
    filter.push({
      bool: {
        should: [
          { term: { type: text } },
          { term: { id: text } },
          { wildcard: { email: `*${text}*` } },
          { wildcard: { name: `*${text}*` } },
          { wildcard: { phone_number: `*${text}*` } },
          { wildcard: { recipientId: `*${text}*` } },
          { wildcard: { family_name: `*${text}*` } },
          { wildcard: { given_name: `*${text}*` } },
          { wildcard: { middle_name: `*${text}*` } },
          { wildcard: { nickname: `*${text}*` } },
          { wildcard: { preferred_username: `*${text}*` } },
        ],
      },
    });
  }

  // handle the various starting positions
  await (async () => {
    // user wants more records (previous page)
    if (prevToken) {
      reversedSearchAfter = getReversedSearchAfter(prevToken);
      reversed = true;
      return;
    }

    // user wants more records (next page)
    if (nextToken) {
      reversedSearchAfter = getReversedSearchAfter(nextToken);
      return;
    }

    // user looking for a specific record and wants the results around it
    if (atToken) {
      // recursively call this search function again requesting
      // the items before the record
      const itemsBefore = await search({
        ...args,
        at: undefined,
        limit: timeJumpRecordsBefore,
        prev: atToken,
      });

      if (itemsBefore.items.length) {
        const lastRecipient = itemsBefore.items[itemsBefore.items.length - 1];

        // search after the record before the one we are looking for so that
        // the one we are looking for shows up in the results
        reversedSearchAfter = [
          lastRecipient.id as string,
          lastRecipient.updated_at as number,
        ];
        if (sortBy) {
          reversedSearchAfter.push(lastRecipient[sortBy.id]);
        }
      }

      // already got the items but we will want the response mapped by
      // the function below
      itemsBeforeJump = Promise.resolve(itemsBefore);

      limit -= timeJumpRecordsBefore;
      return;
    }

    // user wants records before a given date/time
    if (jumpToTimeBefore !== undefined) {
      // Note: not equal or we'll have dups
      reversed = true;
      return;
    }

    // user wants records around a given date/time
    if (jumpToTime) {
      // recursively call this search function again requesting
      // the items before the jump time
      itemsBeforeJump = search({
        ...args,
        before: jumpToTime,
        limit: timeJumpRecordsBefore,
        start: undefined,
      });

      limit -= timeJumpRecordsBefore;
    }
  })();

  const source = Object.keys(strictRecipient).concat([
    "id",
    "tenantId",
    "updated",
  ]);

  const request = {
    _source: source,
    from: 0,
    query: {
      bool: { filter },
    },
    search_after: reversedSearchAfter?.reverse(),
    // get an additional record so we know if there will be a next page
    size: limit + 1,
    sort: [
      ...(sortBy ? [{ [sortBy.id]: sortBy.desc ? "desc" : "asc" }] : []),
      { updated_at: reversed ? "asc" : "desc" },
      // tie breaker (since there will be recipients with the same updated time)
      // NOTE: must have doc value enabled (https://www.elastic.co/guide/en/elasticsearch/reference/7.1/search-request-search-after.html)
      { id: reversed ? "desc" : "asc" },
    ],
  };

  const itemsAfterJump = handleSearchRequest(request, limit, reversed);

  const allSearchRequests = await Promise.all([
    itemsBeforeJump,
    itemsAfterJump,
  ]);

  // merge the items before and after the jump and return
  return allSearchRequests.reduce((response, chunk) => {
    response.items.push(...chunk.items);
    if (chunk.prev && !response.prev) {
      response.prev = chunk.prev;
    }
    if (chunk.next) {
      response.next = chunk.next;
    }
    return response;
  });
};
