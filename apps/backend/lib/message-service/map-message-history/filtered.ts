import { IMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"event:filtered">,
  IMessageHistory<"FILTERED">
> = (log) => ({
  ts: log.timestamp,
  type: "FILTERED",
});

export default map;
