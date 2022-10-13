import { markArchived } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventArchived: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;
  await markArchived(tenantId, messageId);
};
