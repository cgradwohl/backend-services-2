import { IRecipient } from "~/types.api";
import logger from "~/lib/logger";
import elasticSearch from "..";
import { encode } from "../../base64";
import { elasticSearchIndex as index } from "./recipients";
import { IListItem } from "~/triggers/event-bridge/put-into-es";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const idAttribute = process.env.ELASTIC_SEARCH_ID_ATTRIBUTE ?? "id";

interface IListItemWithSubscriptionCount extends IListItem {
  count?: number;
}
export const es = elasticSearch(endpoint, index);

const put = async (list: IListItemWithSubscriptionCount) => {
  const listId = list[idAttribute];

  if (!listId) {
    return;
  }

  const esRecipientId = encode(`${list.tenantId}/${listId}`);

  logger.debug(`RecipientId for Index:- ${esRecipientId}`);

  const document: IRecipient = {
    count: list.count ?? 0,
    id: esRecipientId,
    name: list.title,
    recipientId: listId,
    tenantId: list.tenantId,
    type: "list",
    updated_at: list.updated,
  };

  await es.put(esRecipientId, document);
};

export default put;
