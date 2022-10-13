import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";

const objtype = "webhook";

const webhook: IResolver = async (_, args, context) => {
  const webhookId = args.webhookId;

  return webhookId ? context.dataSources.webhooks.get(webhookId) : null;
};

const webhooks: IResolver = async (_, args, context) => {
  const response = await context.dataSources.webhooks.list(
    args?.after,
    args?.first
  );

  return toConnection(response.items);
};

const saveWebhook: IResolver = async (_, args, context) =>
  context.dataSources.webhooks.save(args.webhook);

const disableWebhook: IResolver = async (_, args, context) =>
  context.dataSources.webhooks.disable(args.webhookId);

const enableWebhook: IResolver = async (_, args, context) =>
  context.dataSources.webhooks.enable(args.webhookId);

const retrieveWebhookSecret: IResolver = async (_, args, context) =>
  context.dataSources.webhooks.retrieveSecret(args.webhookId);

const rotateWebhookSecret: IResolver = async (_, args, context) =>
  context.dataSources.webhooks.rotateSecret(args.webhookId);

export default {
  Query: {
    webhook,
    webhooks,
  },

  Mutation: {
    disableWebhook,
    enableWebhook,
    retrieveWebhookSecret,
    rotateWebhookSecret,
    saveWebhook,
  },

  Webhook: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },
};
