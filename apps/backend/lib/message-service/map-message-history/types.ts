import { EventLogEntryType, IEventLogEntry } from "~/types.api";
import { IMessageHistory, MessageHistoryType } from "../types";

export interface ITypedEventLogEntry<T extends EventLogEntryType>
  extends IEventLogEntry {
  type: T;
}

export type MappableEventLogEntry =
  | ITypedEventLogEntry<"event:click">
  | ITypedEventLogEntry<"event:filtered">
  | ITypedEventLogEntry<"event:notificationId">
  | ITypedEventLogEntry<"event:opened">
  | ITypedEventLogEntry<"event:received">
  | ITypedEventLogEntry<"profile:loaded">
  | ITypedEventLogEntry<"provider:delivered">
  | ITypedEventLogEntry<"provider:delivering">
  | ITypedEventLogEntry<"provider:error">
  | ITypedEventLogEntry<"provider:rendered">
  | ITypedEventLogEntry<"provider:sent">
  | ITypedEventLogEntry<"undeliverable">
  | ITypedEventLogEntry<"unroutable">
  | ITypedEventLogEntry<"event:unmapped">;

export type MapFn<
  FROM extends MappableEventLogEntry,
  TO extends IMessageHistory<MessageHistoryType>
> = (log: FROM) => Readonly<TO>;
