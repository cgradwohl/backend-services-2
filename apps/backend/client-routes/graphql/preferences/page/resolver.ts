import decodeId from "~/client-routes/graphql/lib/decode-id";
import { IContext, IResolver } from "~/client-routes/graphql/types";
import { objType } from "~/preferences/services/dynamo-service";

const getPreferencePage: IResolver<{}, IContext> = async (_, __, context) =>
  context.dataSources.preferencePage.get();

export const PreferencePage = {
  __isTypeOf: (source: { id: string }) => {
    return decodeId(source?.id)?.objtype === objType;
  },
};

export const preferencePage = {
  Query: {
    preferencePage: getPreferencePage,
  },
};
