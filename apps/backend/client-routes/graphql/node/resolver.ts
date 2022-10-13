import decodeId from "~/studio/graphql/lib/decode-id";
import { IResolver } from "../types";

const node: IResolver = async (_, args, context) => {
  const { id, objtype } = decodeId(args.id) ?? {};

  switch (objtype) {
    case "messages":
      return context.dataSources.messages.get(id);
  }
};

export default {
  Query: {
    node,
  },
  Mutation: {},
};
