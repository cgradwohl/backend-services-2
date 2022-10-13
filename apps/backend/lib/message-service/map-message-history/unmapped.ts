import { IMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"event:unmapped">,
  IMessageHistory<"UNMAPPED">
> = (log) => ({
  ts: log.timestamp,
  type: "UNMAPPED",
});

export default map;
