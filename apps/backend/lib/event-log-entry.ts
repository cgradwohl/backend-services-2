import { EventLogEntryType, IEventLogEntry } from "~/types.api";

const byEvent = (...event: EventLogEntryType[]) => ({ type }: IEventLogEntry) =>
  event.includes(type);
const byTimetampAsc = (
  { timestamp: a }: IEventLogEntry,
  { timestamp: b }: IEventLogEntry
) => a - b;
const byTimetampDesc = (
  { timestamp: a }: IEventLogEntry,
  { timestamp: b }: IEventLogEntry
) => b - a;

export const filters = {
  byEvent,
};

export const sorts = {
  byTimetampAsc,
  byTimetampDesc,
};
