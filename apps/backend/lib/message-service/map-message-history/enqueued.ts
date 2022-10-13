import truncateLongStrings from "~/lib/truncate-long-strings";

import { IEnqueuedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"event:received">,
  IEnqueuedMessageHistory
> = (log) => {
  const rawJson =
    typeof log.json === "string" ? JSON.parse(log.json) : log.json;
  // Remove items such as attachments as Base64 strings
  const { body } = truncateLongStrings(rawJson);
  // making it optional to clear the stream
  return {
    data: body?.data,
    event: body?.event,
    override: body?.override,
    profile: body?.profile,
    recipient: body?.recipient,
    ts: log.timestamp,
    type: "ENQUEUED",
  };
};

export default map;
