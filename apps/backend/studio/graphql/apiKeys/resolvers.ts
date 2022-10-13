import { UnpackPromise } from "~/lib/types/unpack-promise";
import toConnection from "../lib/to-connection";
import { IResolver } from "../types";
import ApiKeysDataSource from "./data-source";

type ApiKey = UnpackPromise<ReturnType<ApiKeysDataSource["get"]>>;

const apiKey: IResolver<ApiKey> = async (_, args, context) =>
  args.key ? context.dataSources.apiKeys.get(args.key) : null;

const apiKeys: IResolver<{ keyList: ApiKey[] }> = async (_, args, context) => {
  const response = await context.dataSources.apiKeys.list();
  return toConnection(response.items);
};

const createKey: IResolver = async (_, args, context) => {
  return context.dataSources.apiKeys.create(
    args.fields?.scope,
    context.user,
    args.fields?.name,
    args.fields?.dryRunKey
  );
};

const deleteKey: IResolver = async (_, args, context) => {
  return context.dataSources.apiKeys.delete(args.key, context.user);
};

const rotateKey: IResolver = async (_, args, context) => {
  return context.dataSources.apiKeys.rotate(args.key, context.user);
};

export default {
  Query: {
    apiKey,
    apiKeys,
  },

  Mutation: {
    createKey,
    deleteKey,
    rotateKey,
  },
};
