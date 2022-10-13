import { IRoutedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"provider:sent">,
  IRoutedMessageHistory<"SENT">
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;

  return {
    channel: {
      id: json?.channel?.id ?? "",
      label: json?.channel?.label ?? "",
    },
    integration: { id: json.configuration, provider: json.provider },
    ts: log.timestamp,
    type: "SENT",
  };
};

export default map;
