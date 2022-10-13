import { BadCursor } from "~/auditing/lib/errors";
import elasticSearch from "~/lib/elastic-search";
import { NotFound } from "~/lib/http-errors";
import logger from "~/lib/logger";
import { EsResponse } from "~/types.api";
import { AuditEventStoreTypes } from "../dynamo/audit-events";
import {
  IAuditEventAddIndexMapping,
  IAuditEventSearchParams,
  IElasticsearchAuditEvent,
} from "./types";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const shards = process.env.ELASTIC_SEARCH_AUDIT_EVENTS_SHARDS;
const index = "audit-events";
const idAttribute = "auditEventId";
const maxLimit = 50;
const timeJumpRecordsBefore = 15;

const auditEvents = elasticSearch(endpoint, index);

export const auditEventsIndexMappings = {
  mappings: {
    properties: {
      actorEmail: {
        type: "keyword",
      },
      actorId: {
        type: "keyword",
      },
      auditEventId: {
        type: "keyword",
      },
      source: {
        type: "keyword",
      },
      targetEmail: {
        type: "keyword",
      },
      targetId: {
        type: "keyword",
      },
      timestamp: {
        format: "date_optional_time",
        type: "date",
      },
      type: {
        type: "keyword",
      },
      workspaceId: {
        type: "keyword",
      },
    },
  },
  settings: {
    number_of_replicas: 1,
    number_of_shards: shards,
  },
};

export const setIndex = async () => {
  try {
    await auditEvents.deleteIndex();
  } catch (err) {
    // no worries if 404
    if (err?.response?.status !== 404) {
      throw err;
    }
  }

  return auditEvents.setIndex(auditEventsIndexMappings);
};

export const put = async (item: AuditEventStoreTypes.IDDBAuditEvent) => {
  const id = item[idAttribute];

  const esItem: IElasticsearchAuditEvent = {
    actorEmail: item.actor?.email,
    actorId: item.actor?.id,
    auditEventId: item.auditEventId,
    source: item.source,
    targetEmail: item.target?.email,
    targetId: item.target?.id,
    timestamp: item.timestamp,
    type: item.type,
    workspaceId: item.workspaceId,
  };

  await auditEvents.put(id, esItem);
};

export const get = async (id: string) => {
  try {
    return await auditEvents.get(id);
  } catch (err) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
};

// search after values are passed as a string as "<date number>,<record key>"
const getSearchAfter = (value: string): [number, string] => {
  const values = value.split(",");
  const searchAfter: [number, string] = [
    parseInt(values[0], 10),
    values.slice(1).join(","),
  ];

  if (isNaN(searchAfter[0]) || !searchAfter[1]) {
    logger.error("Bad cursor:", value);
    throw new BadCursor();
  }

  return searchAfter;
};

const handleSearchRequest = async (
  request: any,
  limit: number,
  reversed: boolean = false
): Promise<EsResponse<any>> => {
  const { hits: esItems } = await auditEvents.search(request);

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
    actorEmail: item.actorEmail,
    actorId: item.actorId,
    auditEventId: item.auditEventId,
    source: item.source,
    targetEmail: item.targetEmail,
    targetId: item.targetId,
    timestamp: item.timestamp,
    type: item.type,
    workspaceId: item.workspaceId,
  }));

  if (reversed) {
    items.reverse();
  }

  return { items, next, prev };
};

export const search = async (
  args: IAuditEventSearchParams & {
    at?: string;
    before?: number;
    limit?: number;
    next?: string;
    prev?: string;
    start?: number;
  }
): Promise<EsResponse<any>> => {
  const {
    at: atToken,
    before: jumpToTimeBefore,
    limit: unsafeLimit = maxLimit,
    next: nextToken,
    prev: prevToken,
    start: jumpToTime,
    workspaceId,
  } = args;

  const filter: any[] = workspaceId ? [{ term: { workspaceId } }] : [];
  let limit = Math.min(unsafeLimit, maxLimit);
  let searchAfter: [number, string] | undefined;
  let itemsBeforeJump: Promise<EsResponse<any>> = Promise.resolve({
    items: [],
  });
  let reversed = false;

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

    // user looking for a specific message and wants the results around it
    if (atToken) {
      // recursively call this search function again requesting
      // the items before the message
      const itemsBefore = await search({
        ...args,
        at: undefined,
        limit: timeJumpRecordsBefore,
        prev: atToken,
      });

      if (itemsBefore.items.length) {
        const last = itemsBefore.items[itemsBefore.items.length - 1];

        // search after the message before the one we are looking for so that
        // the one we are looking for shows up in the results
        searchAfter = [new Date(last.timestamp).valueOf(), last.auditEventId];
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

  const source = [
    "actorEmail",
    "actorId",
    "auditEventId",
    "source",
    "targetEmail",
    "targetId",
    "timestamp",
    "type",
    "workspaceId",
  ];
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
      { timestamp: reversed ? "asc" : "desc" },
      // tie breaker (since there could be items with the same timestamp)
      // NOTE: must have doc value enabled (https://www.elastic.co/guide/en/elasticsearch/reference/7.1/search-request-search-after.html)
      { auditEventId: reversed ? "desc" : "asc" },
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

export const updateIndex = async (properties: IAuditEventAddIndexMapping) => {
  logger.info(`Updating index with properties`, properties);

  await auditEvents.updateIndex({ properties });
};
