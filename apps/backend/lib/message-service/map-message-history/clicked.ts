import { IRoutedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"event:click">,
  IRoutedMessageHistory<"CLICKED">
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;

  return {
    channel: { id: json.channelId },
    integration: { id: json.providerId, provider: json.providerKey },
    ts: log.timestamp,
    type: "CLICKED",
  };
};

export default map;
