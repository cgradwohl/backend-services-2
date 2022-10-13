import { markUnread } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventUnread: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markUnread(tenantId, messageId);
};
