import { IDDBAudience } from "~/audiences/stores/dynamo/types";
import logger from "~/lib/logger";
import { IAudienceRecipient } from "~/types.api";
import elasticSearch from "..";
import { encode } from "../../base64";
import { elasticSearchIndex as index } from "./recipients";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const idAttribute = process.env.ELASTIC_SEARCH_ID_ATTRIBUTE ?? "audienceId";

export const es = elasticSearch(endpoint, index);

const put = async (audience: IDDBAudience) => {
  const audienceId = audience[idAttribute];

  if (!audienceId) {
    return;
  }

  const esRecipientId = encode(`${audience.workspaceId}/${audienceId}`);

  logger.debug(`audienceId for Index:- ${esRecipientId}`);

  const document: IAudienceRecipient = {
    count: 0,
    id: esRecipientId,
    name: audience.name,
    recipientId: audienceId,
    tenantId: audience.workspaceId,
    type: "audience",
    updated_at: new Date(audience.updatedAt).getTime(),
  };

  await es.put(esRecipientId, document);
};

export default put;
