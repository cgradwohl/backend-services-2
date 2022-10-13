import makeError from "make-error";

import { error } from "~/lib/log";
import elasticSearch from ".";
import { ListMessagesResponse } from "../../types.api";
import getRetentionLimit from "../get-retention-limit";

export const BadCursor = makeError("BadCursor");

interface IElasticSearchArgs {
  archived?: boolean;
  channels?: string[];
  eventId?: string;
  from?: number;
  hasError?: boolean;
  isRead?: boolean;
  jobId?: string;
  listId?: string;
  messageId?: string;
  notificationId?: string;
  providers?: string[];
  recipient?: string;
  recipients?: string[];
  recipientEmail?: string;
  recipientId?: string;
  statuses?: string[];
  tags?: string[];
  tenantId?: string;
  traceId?: string;
}

const elasticSearchEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const elasticSearchShards = process.env.ELASTIC_SEARCH_MESSAGES_SHARDS;
const elasticSearchIndex = "messages";
export const maxLimit = 50;
const timeJumpRecordsBefore = 15;

const messages = elasticSearch(elasticSearchEndpoint, elasticSearchIndex);

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

const getProvidersFilter = (providers?: string[]): any => {
  if (!providers.includes("unrouted")) {
    return {
      bool: {
        should: [
          // NOTE: `provider` handles the legacy provider field.
          // `providers` is a more inclusive field to utilize
          { terms: { provider: providers } },
          { terms: { providers } },
        ],
      },
    };
  }

  // only the unrouted?
  if (providers.length === 1) {
    return {
      bool: { must_not: [{ exists: { field: "provider" } }] },
    };
  }

  // either unrouted or 1+ other providers

  const routedProviders = providers.filter(
    (provider) => provider !== "unrouted"
  );

  return {
    bool: {
      should: [
        {
          bool: {
            must_not: [
              // NOTE: `provider` handles the legacy provider field.
              // `providers` is a more inclusive field to utilize
              { exists: { field: "provider" } },
              { exists: { field: "providers" } },
            ],
          },
        },
        {
          bool: {
            should: [
              // NOTE: `provider` handles the legacy provider field.
              // `providers` is a more inclusive field to utilize
              { terms: { provider: routedProviders } },
              { terms: { providers: routedProviders } },
            ],
          },
        },
      ],
    },
  };
};

const handleSearchRequest = async (
  request: any,
  limit: number,
  reversed: boolean = false
): Promise<ListMessagesResponse> => {
  const { hits: esItems, total } = await messages.search(request);
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

  const items: ListMessagesResponse["messages"] = esItems.map(
    ({ _source: item }) => ({
      channels: item.channels,
      enqueued: item.enqueued,
      errorCount: item.errorCount,
      eventId: item.eventId,
      idempotencyKey: item.idempotencyKey,
      jobId: item.jobId,
      listId: item.listId,
      listMessageId: item.listMessageId,
      messageId: item.id,
      notificationId: item.notificationId,
      provider: item.provider,
      providers: item.providers,
      readTimestamp: item.readTimestamp,
      recipientEmail: item.recipientEmail,
      recipientId: item.recipientId,
      status: item.messageStatus,
      tags: item.tags,
      tenantId: item.tenantId,
      traceId: item.traceId,
    })
  );

  if (reversed) {
    items.reverse();
  }

  return { messages: items, next, prev, total };
};

export const setIndex = async () => {
  try {
    await messages.deleteIndex();
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

  return messages.setIndex({
    mappings: {
      properties: {
        channels: {
          type: "keyword",
        },
        configuration: {
          type: "keyword",
        },
        delivered: {
          format: "epoch_millis",
          type: "date",
        },
        enqueued: {
          format: "epoch_millis",
          type: "date",
        },
        errorMessage: {
          type: "text",
        },
        eventId: {
          type: "keyword",
        },
        id: { type: "keyword" },
        idempotencyKey: {
          type: "keyword",
        },
        jobId: {
          type: "keyword",
        },
        listId: {
          type: "keyword",
        },
        listMessageId: {
          type: "keyword",
        },
        messageStatus: {
          type: "keyword",
        },
        notificationId: {
          type: "keyword",
        },
        provider: {
          type: "keyword",
        },
        providerResponse: {
          enabled: false,
          type: "object",
        },
        providers: {
          type: "keyword",
        },
        readTimestamp: {
          format: "epoch_millis",
          type: "date",
        },
        recipientEmail: {
          type: "keyword",
        },
        recipientId: {
          type: "keyword",
        },
        tags: {
          type: "keyword",
        },
        tenantId: {
          type: "keyword",
        },
        traceId: {
          type: "keyword",
        },
        trackEvent: {
          type: "keyword",
        },
        trackId: {
          type: "keyword",
        },
      },
    },
    settings: {
      number_of_replicas: 1,
      number_of_shards: elasticSearchShards,
    },
  });
};

const getElasticSearchFilter = (args: IElasticSearchArgs) => {
  const {
    archived,
    channels,
    eventId,
    from,
    hasError,
    isRead,
    jobId,
    listId,
    messageId,
    notificationId,
    providers,
    recipient,
    recipients,
    recipientEmail,
    recipientId,
    statuses,
    tags,
    tenantId,
    traceId,
  } = args;

  const filter: any[] = tenantId ? [{ term: { tenantId } }] : [];

  if (from) {
    filter.push({
      range: { enqueued: { gt: from } },
    });
  }

  if (eventId) {
    filter.push({ term: { eventId } });
  }

  if (archived === false) {
    filter.push({
      bool: {
        must_not: {
          exists: {
            field: "archivedTimestamp",
          },
        },
      },
    });
  }

  if (isRead) {
    filter.push({
      exists: {
        field: "readTimestamp",
      },
    });
  }

  if (isRead === false) {
    filter.push({
      bool: {
        must_not: {
          exists: {
            field: "readTimestamp",
          },
        },
      },
    });
  }

  if (listId) {
    filter.push({ term: { listId } });
  }

  if (messageId) {
    filter.push({
      bool: {
        should: [
          { term: { id: messageId } },
          { term: { listMessageId: messageId } },
        ],
      },
    });
  }

  if (jobId) {
    filter.push({ term: { jobId } });
  }

  if (notificationId) {
    filter.push({ term: { notificationId } });
  }

  if (recipientEmail) {
    filter.push({ term: { recipientEmail } });
  }

  if (recipientId) {
    filter.push({ term: { recipientId } });
  }

  if (recipient) {
    filter.push({
      bool: {
        should: [
          { wildcard: { recipientEmail: recipient } },
          { term: { recipientId: recipient } },
        ],
      },
    });
  }

  if (recipients) {
    filter.push({
      bool: {
        should: [{ terms: { recipientId: recipients } }],
      },
    });
  }

  if (statuses) {
    filter.push({ terms: { messageStatus: statuses } });
  }

  if (hasError) {
    filter.push({ range: { errorCount: { gt: 0 } } });
  }

  if (channels) {
    filter.push({
      bool: {
        should: [
          // NOTE: `provider` handles the legacy provider field.
          // `providers` is a more inclusive field to utilize
          { terms: { channels } },
        ],
      },
    });
  }

  if (providers) {
    filter.push(getProvidersFilter(providers));
  }

  if (tags) {
    filter.push({ terms: { tags } });
  }

  if (traceId) {
    filter.push({ term: { traceId } });
  }

  return filter;
};

export const count = async (args: IElasticSearchArgs) => {
  const filter = getElasticSearchFilter(args);

  const request = {
    query: {
      bool: { filter },
    },
  };

  const response = await messages.count(request);
  return response;
};

export const search = async (
  args: IElasticSearchArgs & {
    at?: string;
    before?: number;
    limit?: number;
    next?: string;
    start?: number;
    prev?: string;
  }
): Promise<ListMessagesResponse> => {
  const {
    at: atToken,
    before,
    limit: unsafeLimit = maxLimit,
    next: nextToken,
    prev: prevToken,
    start,
    tenantId,
  } = args;

  // TODO: remove when C-1927 ships
  const retentionLimit = getRetentionLimit(tenantId);
  // END TODO

  const filter = getElasticSearchFilter(args);
  let limit = Math.min(unsafeLimit, maxLimit);
  let searchAfter: [number, string] | undefined;
  let itemsBeforeJump: Promise<ListMessagesResponse> = Promise.resolve({
    messages: [],
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

      if (itemsBefore.messages.length) {
        const lastMessage =
          itemsBefore.messages[itemsBefore.messages.length - 1];

        // search after the message before the one we are looking for so that
        // the one we are looking for shows up in the results
        searchAfter = [lastMessage.enqueued, lastMessage.messageId];
      } else {
        // search starting from the time in the token
        const [atTime] = getSearchAfter(atToken);
        // TODO: remove math.max when C-1927 ships
        filter.push({
          range: { enqueued: { lte: Math.max(atTime, retentionLimit) } },
        });
        // END TODO
      }

      // already got the items but we will want the response mapped by
      // the function below
      itemsBeforeJump = Promise.resolve(itemsBefore);

      limit -= timeJumpRecordsBefore;
      return;
    }

    // user wants records before a given date/time
    if (before !== undefined) {
      // Note: not equal or we'll have dups
      // TODO: remove math.max when C-1927 ships
      filter.push({
        range: { enqueued: { gt: Math.max(before, retentionLimit) } },
      });
      // END TODO
      reversed = true;
      return;
    }

    // user wants records around a given date/time
    if (start) {
      // TODO: remove math.max when C-1927 ships
      filter.push({
        range: { enqueued: { lte: Math.max(start, retentionLimit) } },
      });
      // END TODO

      // recursively call this search function again requesting
      // the items before the jump time
      itemsBeforeJump = search({
        ...args,
        before: start,
        limit: timeJumpRecordsBefore,
        start: undefined,
      });

      limit -= timeJumpRecordsBefore;
    }
  })();

  // add retention limit to query predicate
  // TODO: remove when C-1927 ships
  filter.push({ range: { enqueued: { gte: retentionLimit } } });
  // END TODO

  const request = {
    _source: [
      "channels",
      "enqueued",
      "errorCount",
      "eventId",
      "id",
      "idempotencyKey",
      "jobId",
      "listId",
      "listMessageId",
      "messageStatus",
      "notificationId",
      "provider",
      "providers",
      "readTimestamp",
      "recipientEmail",
      "recipientId",
      "tags",
      "tenantId",
      "traceId",
    ],
    from: 0,
    query: {
      bool: { filter },
    },
    search_after: searchAfter,
    // get an additional record so we know if there will be a next page
    size: limit + 1,
    sort: [
      { enqueued: reversed ? "asc" : "desc" },
      // tie breaker (since there will be messages with the same enqueued time)
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
  return allSearchRequests.reduce(
    (response, chunk) => {
      if (chunk.total) {
        response.total += chunk.total;
      }

      response.messages.push(...chunk.messages);
      if (chunk.prev && !response.prev) {
        response.prev = chunk.prev;
      }
      if (chunk.next) {
        response.next = chunk.next;
      }
      return response;
    },
    {
      messages: [],
      total: 0,
    }
  );
};

export const getMetrics = async ({
  aggregations = "",
  eventId,
  fromDate,
  tenantId,
  toDate,
}: {
  aggregations?: string;
  eventId?: string;
  fromDate?: number;
  tenantId: string;
  toDate?: number;
}): Promise<{
  metrics: any;
  totalHits: number;
}> => {
  const filter: any[] = [{ term: { tenantId } }];

  if (fromDate) {
    const range: {
      delivered: {
        gte: number;
        lte?: number;
      };
    } = {
      delivered: {
        gte: Number(fromDate),
      },
    };

    if (toDate) {
      range.delivered.lte = Number(toDate);
    }

    filter.push({ range });
  }

  if (eventId) {
    filter.push({ term: { eventId } });
  }

  const aggs: any = {};
  const aggsSplit = aggregations.split(",");

  if (aggsSplit.length) {
    aggsSplit.reverse().forEach((agg) => {
      switch (agg) {
        case "by_event":
          aggs.aggs = {
            by_event: {
              aggs: aggs.aggs,
              terms: {
                field: "eventId",
              },
            },
          };
          break;

        case "by_provider":
          aggs.aggs = {
            by_provider: {
              aggs: aggs.aggs,
              terms: {
                field: "provider",
              },
            },
          };
          break;

        case "by_status":
          aggs.aggs = {
            by_status: {
              aggs: aggs.aggs,
              terms: {
                field: "messageStatus",
              },
            },
          };

          break;

        case "by_day":
          aggs.aggs = {
            by_day: {
              aggs: aggs.aggs,
              date_histogram: {
                field: "delivered",
                format: "yyyy-MM-dd",
                interval: "day",
                time_zone: "America/Los_Angeles",
              },
            },
          };
          break;
      }
    });
  }

  const results = await messages.raw({
    query: {
      bool: { filter },
    },
    size: 0,
    ...aggs,
  });

  return {
    metrics: results.aggregations,
    totalHits: results.hits.total.value,
  };
};
