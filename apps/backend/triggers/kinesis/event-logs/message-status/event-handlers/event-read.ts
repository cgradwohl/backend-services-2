import { markRead } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventRead: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markRead(tenantId, messageId);
};
