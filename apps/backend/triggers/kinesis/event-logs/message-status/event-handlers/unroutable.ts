import { markUnroutable } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const unroutable: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markUnroutable(tenantId, messageId);
};
