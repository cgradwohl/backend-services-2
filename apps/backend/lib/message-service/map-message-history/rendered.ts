import { IRenderedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"provider:rendered">,
  IRenderedMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const renderedTemplate = json.renderedTemplate ?? {};

  const output = Object.keys(renderedTemplate).reduce(
    (acc, key) => ({
      ...acc,
      [key]: `/messages/${log.messageId}/output/${log.id}/${key}`,
    }),
    {}
  );

  return {
    channel: { id: json.channel.id, label: json.channel.label },
    integration: { id: json.configuration, provider: json.provider },
    output,
    ts: log.timestamp,
    type: "RENDERED",
  };
};

export default map;
