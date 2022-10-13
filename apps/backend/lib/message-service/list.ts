import { search } from "~/lib/elastic-search/messages";
import createMessages from "./create-messages";
import { IMessageLogList } from "./types";

const LIMIT = 10;

export default async (
  tenantId: string,
  params: {
    archived?: string;
    cursor?: string;
    eventId?: string;
    jobId?: string;
    listId?: string;
    messageId?: string;
    notificationId?: string;
    recipient?: string;
    tags?: string[];
    traceId?: string;
    status?: string[];
  }
): Promise<IMessageLogList> => {
  const { cursor, archived } = params;

  const args = {
    archived: archived === "false" ? false : true,
    eventId: params.eventId,
    jobId: params.jobId,
    limit: LIMIT,
    listId: params.listId,
    messageId: params.messageId,
    next: cursor ? convertBase64ToString(cursor) : undefined,
    notificationId: params.notificationId,
    recipient: params.recipient,
    statuses: params.status,
    tags: params.tags,
    traceId: params.traceId,
    tenantId,
  };

  const { messages, next } = await search(args);

  const results = await createMessages(tenantId, messages, false);

  return {
    paging: {
      cursor: next ? convertStringToBase64(next) : undefined,
      more: Boolean(next),
    },
    results,
  };
};

const convertStringToBase64 = (value: string) => {
  const buff = Buffer.from(value, "utf8");

  return buff.toString("base64");
};

const convertBase64ToString = (value: string) => {
  const buff = Buffer.from(value, "base64");

  return buff.toString("utf8");
};
