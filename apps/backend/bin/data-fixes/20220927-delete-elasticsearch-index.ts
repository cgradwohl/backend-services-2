import elasticsearch from "~/lib/elastic-search";
import { CourierLogger } from "~/lib/logger";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  index: "event-logs" | "recipients"; // doing this intentionally to avoid mishaps
}

const elasticSearchEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;

const handler: Handler<IEvent> = async (event) => {
  const { logger } = new CourierLogger("delete-elasticsearch-index");
  const { index } = event;

  if (!["event-logs", "recipients"].includes(index)) {
    logger.warn(`Not allowed to delete index ${index}`);
    return;
  }

  const client = elasticsearch(elasticSearchEndpoint, index);

  try {
    await client.deleteIndex();
    logger.info(`Deleted index ${index}`);
  } catch (e) {
    logger.warn(`Error occurred while deleting index`);
    logger.warn(e);
  }
};
export default handler;
