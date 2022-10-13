import { markUnmapped } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventUnmapped: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markUnmapped(tenantId, messageId);
};
