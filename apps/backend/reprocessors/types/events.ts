import { EventLogEntryType, IEventLogEntryJson } from "~/types.api";
import {
  IReprocessorPayload,
  IReprocessorPayloadInput,
  IReprocessorPayloadMetadata,
} from "../types";

export interface IEventReprocessorPayloadInput
  extends IReprocessorPayloadInput {
  messageId: string;
  type: EventLogEntryType;
  json: IEventLogEntryJson;
  ts: number;
}

export interface IEventReprocessorPayloadMetadata
  extends IReprocessorPayloadMetadata {
  type: "event";
}

export interface IEventReprocessorPayload extends IReprocessorPayload {
  input: IEventReprocessorPayloadInput;
  metadata: IEventReprocessorPayloadMetadata;
}
