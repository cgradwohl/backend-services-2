import { markUnroutable } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventFiltered: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markUnroutable(tenantId, messageId);
};
