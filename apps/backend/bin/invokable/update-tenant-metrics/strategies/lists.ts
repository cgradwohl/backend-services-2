import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { list as listLists } from "~/lib/lists";
import Strategy, { ITenantMetricCollection } from "./strategy";

import { IListItem } from "~/lib/lists/types";
import { CourierObject, ITenant } from "~/types.api";

let lists: Array<CourierObject<IListItem>> = [];

const getLists = async (tenantId: string) => {
  let lastKey: DocumentClient.Key;
  let results = [];

  do {
    const { items, lastEvaluatedKey } = await listLists(tenantId, lastKey);
    if (items?.length) {
      results = results.concat(items);
    }
    lastKey = lastEvaluatedKey;
  } while (lastKey);

  lists = results;
};

const getListsCount = () => {
  return { list_count: lists.length };
};

const getListsLastCreated = () => {
  lists.sort((a, b) => (new Date(a.created) > new Date(b.created) ? 1 : -1));

  const lastCreated = lists.length > 0 ? lists[0].created : undefined;

  return { list_last_created: lastCreated };
};

const getListsLastUpdated = () => {
  lists.sort((a, b) => (new Date(a.updated) > new Date(b.updated) ? 1 : -1));

  const lastUpdated = lists.length > 0 ? lists[0].updated : undefined;

  return { list_last_updated: lastUpdated };
};

export default class Lists extends Strategy {
  constructor() {
    super("lists");
  }

  public async collect(tenant: ITenant) {
    const { tenantId } = tenant;

    await getLists(tenantId);

    const metrics: ITenantMetricCollection[] = [
      getListsCount(),
      getListsLastCreated(),
      getListsLastUpdated(),
    ];
    return metrics;
  }
}
