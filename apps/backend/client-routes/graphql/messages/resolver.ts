import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "~/studio/graphql/lib/decode-id";
import { IResolver } from "../types";
import toESConnection from "~/studio/graphql/lib/to-elastic-search-connection";
import MessagesDataSource from "./data-source";
import { decode } from "~/lib/base64";
import Message from "./Message";
type Messages = UnpackPromise<ReturnType<MessagesDataSource["get"]>>;
const objtype = "messages";
const EVENT_TRACK_TYPES = {
  READ: "read",
  DELIVERED: "delivered",
};

const banners: IResolver = async (_, args, context) => {
  const recipient = context.user?.id;
  const recipients = context.userIds;

  const { after, limit, params } = args;
  const next = after ? decode(after) : undefined;
  const response = await context.dataSources.messages.listBanners({
    limit,
    next,
    params,
    recipient,
    recipients,
  });

  return {
    totalCount: response.total,
    ...toESConnection(response.items, response.next, response.prev),
  };
};

const inbox: IResolver = async (_, args, context) => {
  const recipient = context.user?.id;

  const { after, limit, params } = args;
  const next = after ? decode(after) : undefined;
  const response = await context.dataSources.messages.listInbox({
    limit,
    next,
    params,
    recipient,
  });

  return {
    totalCount: response.total,
    ...toESConnection(response.items, response.next, response.prev),
  };
};

const messages: IResolver = async (_, args, context) => {
  const recipient = context.user?.id;

  const { after, limit, params } = args;
  const next = after ? decode(after) : undefined;
  const response = await context.dataSources.messages.listMessages({
    limit,
    next,
    params,
    recipient,
  });

  return {
    totalCount: response.total,
    ...toESConnection(response.items, response.next, response.prev),
  };
};

const messageCount: IResolver = async (_, args, context) => {
  const recipient = context.user?.id;
  const { params } = args;
  const totalCount = await context.dataSources.messages.count({
    recipient,
    params,
  });

  return totalCount;
};

const content: IResolver<Messages> = async (source, _, context) => {
  const message = new Message(
    source.message.tenantId,
    source.message,
    source.locale
  );
  return message.content();
};

const trackEvent: IResolver = async (_, args, context) => {
  await context.dataSources.messages.trackEvent(args.trackingId);

  return {
    id: args.trackingId,
  };
};

const batchTrackEvent: IResolver = async (_, args, context) => {
  const recipient = context.user?.id;
  const { eventType, startCursor } = args;
  let promises;
  let ids = [];
  let params = {
    isRead: true,
  };
  if (eventType === EVENT_TRACK_TYPES.READ) {
    params.isRead = false;
  }
  const { messages } = await context.dataSources.messages.listAll({
    recipient,
    params,
    startCursor,
  });
  promises = messages.map(async ({ messageId }) => {
    ids.push(messageId);
    const message = await context.dataSources.messages.get(messageId);
    if (eventType === EVENT_TRACK_TYPES.READ) {
      await message.markRead();
    }
  });

  await Promise.all(promises);
  return {
    ids,
    startCursor,
  };
};

export default {
  Query: {
    inbox,
    banners,
    messages,
    messageCount,
  },

  Mutation: {
    trackEvent,
    batchTrackEvent,
  },

  Block: {
    __resolveType(obj) {
      switch (obj.type) {
        case "text": {
          return "TextBlock";
        }
        case "action": {
          return "ActionBlock";
        }
        default: {
          return null; // GraphQLError is thrown
        }
      }
    },
  },

  Messages: {
    __isTypeOf: (source: Messages) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
    content,
  },
};
