import { IProfileLoadedMessageHistory } from "../types";
import { ITypedEventLogEntry, MapFn } from "./types";

const map: MapFn<
  ITypedEventLogEntry<"profile:loaded">,
  IProfileLoadedMessageHistory
> = (log) => {
  const json = typeof log.json === "string" ? JSON.parse(log.json) : log.json;

  return {
    merged_profile: json.mergedProfile,
    received_profile: json.sentProfile,
    stored_profile: json.savedProfile,
    ts: log.timestamp,
    type: "PROFILE_LOADED",
  };
};

export default map;
