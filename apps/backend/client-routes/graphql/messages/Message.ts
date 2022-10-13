import {
  IEventLogEntry,
  IEventLogEntryJson,
  PartialMessage,
} from "~/types.api";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import { createReadEvent, getLogs } from "~/lib/dynamo/event-logs";
import { renderContext } from "~/send/render-context";
import { contextService } from "~/send/service";

const getJSONFromEventType = (
  events: IEventLogEntry[],
  _type,
  _provider = "courier"
): IEventLogEntryJson => {
  const matchedEvents = events.find(
    ({ type = "", json: { provider } = {} }) => {
      if (provider) {
        return provider === _provider && type === _type;
      }

      return type === _type;
    }
  );

  return matchedEvents?.json || {};
};

export default class Message {
  channels: string[];
  created: number;
  id: string;
  locale: string;
  message: PartialMessage;
  messageId: string;
  objtype: string;
  provider: string;
  read: boolean;
  tags: string[];
  tenantId: string;

  constructor(tenantId: string, message: PartialMessage, locale?: string) {
    this.objtype = "messages";
    this.id = createEncodedId(message.messageId.toString(), this.objtype);

    this.message = message;
    this.locale = locale;
    this.messageId = message.messageId;
    this.created = message.enqueued;
    this.tenantId = tenantId;
    this.channels = message.channels as unknown as string[];
    this.provider = message.provider;
    this.read = Boolean(message.readTimestamp);
    this.tags = message.tags ?? [];
  }

  async markRead() {
    await createReadEvent(this.tenantId, this.messageId, {
      provider: this.provider,
    });
  }

  get() {
    const { messageId, created, id, read, tags, locale, message } = this;
    return {
      created,
      id,
      locale,
      message,
      messageId,
      read,
      tags,
      userId: message.recipientId,
    };
  }

  async content() {
    const eventLogs = await getLogs(this.tenantId, this.messageId);
    const eventReceivedJSON = getJSONFromEventType(eventLogs, "event:received");
    const renderedJSON = getJSONFromEventType(eventLogs, "provider:rendered");
    const { renderedTemplate, trackingIds, brand } = renderedJSON;

    if (this.channels?.includes("banner:courier")) {
      const eventPreparedJSON = getJSONFromEventType(
        eventLogs,
        "event:prepared"
      );

      const context = await contextService(this.tenantId).get({
        filePath: eventPreparedJSON.contextFilePath,
      });

      const rendered = await renderContext(context, {
        channel: "banner",
        provider: "courier",
        locale: this.locale,
      });

      const data =
        eventReceivedJSON?.body?.override?.channel?.banner?.data ??
        eventReceivedJSON?.body?.message?.channels?.banner?.override?.data;

      if (rendered) {
        return {
          blocks: rendered.renderedTemplates.blocks,
          body: rendered.renderedTemplates.body,
          brand,
          data,
          title: rendered.renderedTemplates.title,
          trackingIds,
        };
      }
    }

    const data =
      eventReceivedJSON?.body?.override?.channel?.push?.data ??
      eventReceivedJSON?.body?.message?.channels?.push?.override?.data;

    return {
      blocks: renderedTemplate?.blocks,
      body: renderedTemplate?.body,
      brand,
      data,
      title: renderedTemplate?.title,
      trackingIds,
    };
  }
}
