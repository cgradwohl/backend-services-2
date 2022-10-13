import elasticSearch from ".";
import { EsResponse } from "../../types.api";
import makeError from "make-error";
import { error } from "~/lib/log";

const elasticSearchEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const elasticSearchShards = process.env.ELASTIC_SEARCH_AUTOMATION_RUNS_SHARDS;
const elasticSearchIndex = "automation-runs";
const maxLimit = 50;
const timeJumpRecordsBefore = 15;

const automationRuns = elasticSearch(elasticSearchEndpoint, elasticSearchIndex);

export const BadCursor = makeError("BadCursor");

// search after values are passed as a string as "<date number>,<record key>"
const getSearchAfter = (value: string): [number, string] => {
  const values = value.split(",");
  const searchAfter: [number, string] = [
    parseInt(values[0], 10),
    values.slice(1).join(","),
  ];

  if (isNaN(searchAfter[0]) || !searchAfter[1]) {
    // temporarily log the bad cursor values because a customer hit this
    // under normal use
    error("Bad cursor:", value);

    throw new BadCursor();
  }

  return searchAfter;
};

const handleSearchRequest = async (
  request: any,
  limit: number,
  reversed: boolean = false
): Promise<EsResponse<any>> => {
  const { hits: esItems } = await automationRuns.search(request);

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

  const items: any[] = esItems.map(({ _source: item }) => ({
    createdAt: item.createdAt,
    runId: item.runId,
    source: typeof item.source === "string" ? [item.source] : item.source,
    status: item.status,
    tenantId: item.tenantId,
    type: item.type,
  }));

  if (reversed) {
    items.reverse();
  }

  return { items, next, prev };
};

export const search = async (args: {
  at?: string;
  before?: number;
  limit?: number;
  next?: string;
  prev?: string;
  text?: string;
  start?: number;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  statuses?: string[];
}): Promise<EsResponse<any>> => {
  const {
    at: atToken,
    before: jumpToTimeBefore,
    limit: unsafeLimit = maxLimit,
    next: nextToken,
    prev: prevToken,
    start: jumpToTime,
    text,
    tenantId,
    startDate,
    endDate,
    statuses,
  } = args;

  const filter: any[] = tenantId ? [{ term: { tenantId } }] : [];
  let limit = Math.min(unsafeLimit, maxLimit);
  let searchAfter: [number, string] | undefined;
  let itemsBeforeJump: Promise<EsResponse<any>> = Promise.resolve({
    items: [],
  });
  let reversed = false;

  if (text) {
    filter.push({
      bool: {
        should: [
          { match: { runId: text } },
          { match: { source: text } },
          { match: { status: text } },
        ],
      },
    });
  }

  if (startDate || endDate) {
    filter.push({
      bool: {
        must: [
          {
            range: {
              createdAt: {
                gte: startDate || new Date("2021-01-01").toISOString(),
                lte: endDate || new Date().toISOString(),
              },
            },
          },
        ],
      },
    });
  }

  if (statuses && statuses.length) {
    filter.push({ terms: { status: statuses } });
  }

  // handle the various starting positions
  await (async () => {
    // user wants more records (previous page)
    if (prevToken) {
      searchAfter = getSearchAfter(prevToken);
      reversed = true;
      return;
    }

    // user wants more records (next page)
    if (nextToken) {
      searchAfter = getSearchAfter(nextToken);
      return;
    }

    // user looking for a specific object and wants the results around it
    if (atToken) {
      // recursively call this search function again requesting
      // the items before the object
      const itemsBefore = await search({
        ...args,
        at: undefined,
        limit: timeJumpRecordsBefore,
        prev: atToken,
      });

      if (itemsBefore.items.length) {
        const last = itemsBefore.items[itemsBefore.items.length - 1];

        // search after the object before the one we are looking for so that
        // the one we are looking for shows up in the results
        searchAfter = [new Date(last.createdAt).valueOf(), last.runId];
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

  const source = ["createdAt", "runId", "source", "status", "tenantId", "type"];
  const request = {
    _source: source,
    from: 0,
    query: {
      bool: { filter },
    },
    search_after: searchAfter,
    // get an additional record so we know if there will be a next page
    size: limit + 1,
    sort: [
      { createdAt: reversed ? "asc" : "desc" },
      // tie breaker (since there could be items with the same createdAt time)
      // NOTE: must have doc value enabled (https://www.elastic.co/guide/en/elasticsearch/reference/7.1/search-request-search-after.html)
      { runId: reversed ? "desc" : "asc" },
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

export const setIndex = async () => {
  try {
    await automationRuns.deleteIndex();
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

  return automationRuns.setIndex({
    mappings: {
      properties: {
        createdAt: { format: "date_optional_time", type: "date" },
        runId: { type: "keyword" },
        source: { type: "keyword" },
        status: { type: "keyword" },
        tenantId: { type: "keyword" },
        type: { type: "keyword" },
      },
    },
    settings: {
      number_of_replicas: 1,
      number_of_shards: elasticSearchShards,
    },
  });
};
