import providers from "~/providers";
import { IDeliveredMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"provider:delivered">,
  IDeliveredMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  const provider = providers[json.provider];
  const providerResponse =
    typeof json.providerResponse === "string"
      ? JSON.parse(json.providerResponse)
      : json.providerResponse;
  const ts =
    provider?.getDeliveredTimestamp?.(providerResponse) ?? log.timestamp;
  const reference = provider?.getReference?.(providerResponse, undefined) ?? {};
  try {
    const { id, label } = json.channel ?? {};

    return {
      channel: { id, label },
      integration: { id: json.configuration, provider: json.provider },
      reference,
      ts,
      type: "DELIVERED",
    };
  } catch (err) {
    console.error("('########## err: ", err);
    console.error("########## log:", log);
    throw err;
  }
};

export default map;
