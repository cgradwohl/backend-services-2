import { toApiKey } from "~/lib/api-key-uuid";

import { IMappedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"event:notificationId">,
  IMappedMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;

  return {
    event_id: json.eventId,
    notification_id: toApiKey(json.notificationId),
    ts: log.timestamp,
    type: "MAPPED",
  };
};

export default map;
