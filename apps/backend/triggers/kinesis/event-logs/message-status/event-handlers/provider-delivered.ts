import { markDelivered } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const providerDelivered: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;

  const json =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;

  await markDelivered(tenantId, messageId, json.provider, json.configuration);
};
