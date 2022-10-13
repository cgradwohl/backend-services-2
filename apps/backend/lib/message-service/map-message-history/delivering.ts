import { IRoutedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"provider:delivering">,
  IRoutedMessageHistory<"DELIVERING">
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const { id, label } = json.channel;

  return {
    channel: { id, label },
    integration: { id: json.configuration, provider: json.provider },
    ts: log.timestamp,
    type: "DELIVERING",
  };
};

export default map;
