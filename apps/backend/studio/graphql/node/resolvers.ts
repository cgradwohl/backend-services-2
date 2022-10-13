import decodeId from "../lib/decode-id";
import { IResolver } from "../types";

const node: IResolver = async (_, args, context) => {
  const { id, objtype } = decodeId(args.id) ?? {};

  switch (objtype) {
    case "brand":
      return context.dataSources.brands.get(id);

    case "category":
      return context.dataSources.categories.get(id);

    case "recipient_2022_01_28":
      return context.dataSources.recipients_2022_01_28.get(id);

    case "tag":
      return context.dataSources.tags.get(id);

    case "template":
      return context.dataSources.templates.get(id);

    case "tenant":
      return context.dataSources.tenants.get(id);

    case "webhook":
      return context.dataSources.webhooks.get(id);

    case "user":
      return context.dataSources.users.get(id);
  }
};

export default {
  Query: {
    node,
  },
};
