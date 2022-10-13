import { IResolver } from "../types";

const sendRoutingStrategy: IResolver = (_, _args, context) =>
  context.dataSources.sendRoutingStrategy.get();

const setSendRoutingStrategy: IResolver = async (_, args, context) => {
  await context.dataSources.sendRoutingStrategy.set(args.strategy);
  return {
    success: true,
  };
};

export default {
  Query: {
    sendRoutingStrategy,
  },

  Mutation: {
    setSendRoutingStrategy,
  },
};
