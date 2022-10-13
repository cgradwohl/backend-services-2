import { IProviderErrorMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"provider:error">,
  IProviderErrorMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const channel = json.channel
    ? { id: json.channel.id, label: json.channel?.label }
    : undefined;
  const integration =
    json.configuration || json.provider
      ? { id: json?.configuration, provider: json?.provider }
      : undefined;

  return {
    channel,
    error_message: json.errorMessage,
    integration,
    ts: log.timestamp,
    type: "UNDELIVERABLE",
  };
};

export default map;
