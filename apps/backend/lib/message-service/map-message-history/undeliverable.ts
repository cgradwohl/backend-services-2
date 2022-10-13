import { IUndeliverableMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"undeliverable">,
  IUndeliverableMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const channel = json.channel
    ? { id: json.channel.id, label: json.channel.label }
    : undefined;
  const integration = json.configuration
    ? { id: json.configuration, provider: json.provider }
    : undefined;

  return {
    channel,
    integration,
    reason: json.type,
    reasonCode: json.reasonCode,
    ts: log.timestamp,
    type: "UNDELIVERABLE",
  };
};

export default map;
