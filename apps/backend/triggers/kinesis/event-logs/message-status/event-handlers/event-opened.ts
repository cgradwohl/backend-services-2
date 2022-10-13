import { markOpened, markRead } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";
import { OpenedEventData } from "~/lib/dynamo/event-logs";

export const eventOpened: UpdateMessageStatusFn<OpenedEventData> = async (
  event
) => {
  const { messageId, tenantId, timestamp } = event;
  await markOpened(tenantId, messageId, timestamp);
  await markRead(tenantId, messageId);

  if (event.json?.channels) {
    //TODO Mark messageId read in Inbox
  }
};
