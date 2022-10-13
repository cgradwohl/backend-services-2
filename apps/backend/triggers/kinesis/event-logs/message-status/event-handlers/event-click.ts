import { createReadEvent } from "~/lib/dynamo/event-logs";
import { markClicked } from "~/lib/dynamo/messages";
import logger from "~/lib/logger";
import { UpdateMessageStatusFn } from "./types";

export const eventClick: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId, timestamp } = event;
  await markClicked(tenantId, messageId, timestamp);
  let providerKey;
  try {
    const parsedJSON =
      typeof event.json === "string" ? JSON.parse(event.json) : event.json;
    providerKey = parsedJSON.providerKey;
  } catch (e) {
    logger.debug({ e });
    console.log("error", e);
  }

  if (providerKey === "courier") {
    //If the click event happens and it is a courier provider
    //also create a read event
    await createReadEvent(tenantId, messageId, {
      provider: providerKey,
    });
  }
};
