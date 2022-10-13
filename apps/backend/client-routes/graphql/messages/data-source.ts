import { get as getMessage } from "~/lib/dynamo/messages";
import { count, maxLimit, search } from "~/lib/elastic-search/messages";
import { NotFound } from "~/lib/http-errors";
import trackEvent from "~/lib/tracking-service/track-event";
import DataSource from "~/studio/graphql/lib/data-source";
import { PartialMessage } from "~/types.api";
import { getFromTime } from "../lib/get-from-time";
import Message from "./Message";

interface IFilterParams {
  from?: number;
  tags?: string[];
}

interface IListBannersParams {
  limit?: number;
  next?: string;
  params?: IFilterParams & {
    locale?: string;
  };
  prev?: string;
  recipient: string;
  recipients: string[];
}

interface IListMessagesParams {
  recipient: string;
  limit?: number;
  next?: string;
  params?: IFilterParams & {
    isRead?: boolean;
  };
  prev?: string;
}

export default class MessagesDataSource extends DataSource {
  public tenantId: string;
  public objtype: string;

  public initialize(config) {
    super.initialize(config);
    this.objtype = "messages";
    this.tenantId = this.getEnvScopedTenantId();
  }

  public async get(messageId: string, locale?: string) {
    try {
      const message = await getMessage(this.tenantId, messageId);
      if (!message) {
        throw new NotFound();
      }
      return new Message(this.tenantId, message, locale);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async listAll({
    recipient,
    params,
    messages = [],
    startCursor,
    iterations = 0,
  }) {
    if (iterations > 10) {
      // If amount of messages is greater than maxLimit * 10
      // returning with start cursor
      return { messages, startCursor };
    }
    const { items, next } = await this.listMessages({
      recipient,
      params,
      next: startCursor,
      limit: maxLimit,
    });
    messages = messages.concat(items);
    if (next) {
      return this.listAll({
        recipient,
        params,
        messages,
        startCursor: next,
        iterations: iterations++,
      });
    }
    return { messages };
  }

  public async listMessages({
    limit = 10,
    next,
    params,
    recipient,
  }: IListMessagesParams) {
    let items = [];
    const defaultFrom = await getFromTime(this.tenantId);
    const args = {
      ...params,
      archived: false,
      channels: ["push:web:courier", "push:*", "push:web:*", "push:courier"],
      from: params?.from ?? defaultFrom,
      limit,
      next,
      providers: ["courier"],
      recipient,
      statuses: ["SENT", "DELIVERED", "CLICKED", "OPENED"],
      tags: params?.tags,
      tenantId: this.tenantId,
    };

    const results = await search(args);
    items = results.messages.map((message) => this.map(message));

    return {
      total: results.total,
      items,
      prev: results.prev,
      next: results.next,
    };
  }

  public async listBanners({
    limit = 10,
    next,
    params,
    recipient,
    recipients,
  }: IListBannersParams) {
    let items = [];
    const { locale, ...restParams } = params ?? {};
    const defaultFrom = await getFromTime(this.tenantId);
    const args = {
      ...restParams,
      archived: false,
      channels: ["banner:*", "banner:courier"],
      from: params?.from ?? defaultFrom,
      limit,
      next,
      providers: ["courier"],
      recipient,
      recipients,
      statuses: ["SENT", "DELIVERED", "CLICKED", "OPENED"],
      tags: params?.tags,
      tenantId: this.tenantId,
    };

    const results = await search(args);
    items = results.messages.map((message) => this.map(message, locale));

    return {
      total: results.total,
      items,
      prev: results.prev,
      next: results.next,
    };
  }

  public async listInbox({
    limit = 10,
    next,
    params,
    recipient,
  }: IListMessagesParams) {
    let items = [];
    const defaultFrom = await getFromTime(this.tenantId);
    const args = {
      ...params,
      archived: false,
      channels: ["inbox:*", "inbox:courier"],
      from: params?.from ?? defaultFrom,
      limit,
      next,
      providers: ["courier"],
      recipient,
      statuses: ["SENT", "DELIVERED", "CLICKED", "OPENED"],
      tags: params?.tags,
      tenantId: this.tenantId,
    };

    const results = await search(args);
    items = results.messages.map((message) => this.map(message));

    return {
      total: results.total,
      items,
      prev: results.prev,
      next: results.next,
    };
  }

  public async count({
    recipient,
    params,
  }: {
    recipient?: string;
    params?: IFilterParams;
  }) {
    const defaultFrom = await getFromTime(this.tenantId);
    const args = {
      ...params,
      archived: false,
      channels: ["push:web:courier", "push:*", "push:web:*", "push:courier"],
      from: params?.from ?? defaultFrom,
      providers: ["courier"],
      recipient,
      statuses: ["SENT", "DELIVERED", "CLICKED", "OPENED"],
      tenantId: this.tenantId,
    };

    const response = await count(args);
    return response?.count ?? 0;
  }

  public async trackEvent(trackingId: string) {
    return trackEvent({
      tenantId: this.tenantId,
      trackingId,
    });
  }

  protected map = (message: PartialMessage, locale?: string) => {
    return new Message(this.tenantId, message, locale).get();
  };
}
