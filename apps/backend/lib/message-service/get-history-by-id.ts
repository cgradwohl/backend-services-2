import { BadRequest } from "~/lib/http-errors";
import { EventLogEntryType } from "~/types.api";
import { getLogs } from "../dynamo/event-logs";
import { filters } from "../event-log-entry";
import { Errors } from "./errors";
import mapMessageHistory from "./map-message-history";
import { IMessageHistory, MessageHistoryType } from "./types";

const HISTORY_STATUS_TO_EVENT_TYPE: ReadonlyMap<
  MessageHistoryType,
  readonly EventLogEntryType[]
> = new Map([
  ["CLICKED", ["event:click"]],
  ["DELIVERED", ["provider:delivered"]],
  ["ENQUEUED", ["event:received"]],
  ["FILTERED", ["event:filtered"]],
  ["MAPPED", ["event:notificationId"]],
  ["OPENED", ["event:opened"]],
  ["PROFILE_LOADED", ["profile:loaded"]],
  ["RENDERED", ["provider:rendered"]],
  ["SENT", ["provider:sent"]],
  ["UNDELIVERABLE", ["provider:error", "undeliverable"]],
  ["UNMAPPED", ["event:unmapped"]],
  ["UNROUTABLE", ["unroutable"]],
]);

const MAPPABLE_EVENTS: readonly EventLogEntryType[] = [
  ...HISTORY_STATUS_TO_EVENT_TYPE.values(),
].reduce((acc, v) => {
  Array.prototype.push.apply(acc, v);

  return acc;
}, []);

const ALLOWED_TYPE_FILTERS: readonly string[] = [
  ...HISTORY_STATUS_TO_EVENT_TYPE.keys(),
].map((k) => String(k));

function assertIsMessageHistoryType(
  type: string
): asserts type is MessageHistoryType {
  if (type !== undefined && !ALLOWED_TYPE_FILTERS.includes(type)) {
    throw new BadRequest(
      `Unknown type ${type} used to filter Message History.`
    );
  }
}

const getHistoryById = async (
  tenantId: string,
  id: string,
  type: string
): Promise<Array<IMessageHistory<MessageHistoryType>>> => {
  assertIsMessageHistoryType(type);

  const logs = await getLogs(tenantId, id);
  if (!logs.length) {
    throw new Errors.MessageNotFoundError(`Message ${id} not found`);
  }

  const filteredLogs = HISTORY_STATUS_TO_EVENT_TYPE.has(type)
    ? logs.filter(({ type: t }) =>
        HISTORY_STATUS_TO_EVENT_TYPE.get(type).includes(t)
      )
    : logs.filter(filters.byEvent(...MAPPABLE_EVENTS));
  return filteredLogs
    .map(mapMessageHistory)
    .sort(({ ts: a }, { ts: b }) => a - b);
};

export default getHistoryById;
