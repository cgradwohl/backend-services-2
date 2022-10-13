import { ISafeEventLogEntry } from "~/types.internal";

export type UpdateMessageStatusFn<T = any> = (
  event: ISafeEventLogEntry<T>
) => Promise<void>;
