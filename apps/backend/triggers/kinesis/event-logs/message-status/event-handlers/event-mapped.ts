import { setNotificationId as markMapped } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const eventMapped: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;

  const json =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;

  await markMapped(tenantId, messageId, json.notificationId);
};
