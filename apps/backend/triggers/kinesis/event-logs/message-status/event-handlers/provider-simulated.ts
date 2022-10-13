import { markSimulated } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const providerSimulated: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  const { configuration, provider: providerKey } =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;

  await markSimulated(tenantId, messageId, providerKey, configuration);
};
