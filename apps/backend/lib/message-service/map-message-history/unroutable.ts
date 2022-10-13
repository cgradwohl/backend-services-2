import { IUnroutableMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"unroutable">,
  IUnroutableMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const channel = json.channel
    ? { id: json.channel.id, label: json.channel.label }
    : undefined;

  return {
    channel,
    reason: json.type,
    ts: log.timestamp,
    type: "UNROUTABLE",
  };
};

export default map;
