import decodeId from "~/studio/graphql/lib/decode-id";
import { IResolver } from "~/studio/graphql/types";
import { objType } from "./data-source";

export const PreferencesPage = {
  __isTypeOf: (source: { id: string }) => {
    return decodeId(source?.id)?.objtype === objType;
  },
};

const getPreferencesPage: IResolver = async (_, __, context) => {
  return await context.dataSources.preferencesPageDataSource.get();
};

const publishPreferencesPage: IResolver = async (_, __, context) => {
  return await context.dataSources.preferencesPageDataSource.publish(
    Date.now()
  );
};

export default {
  Query: {
    preferencesPage: getPreferencesPage,
  },
  Mutation: {
    publishPreferencesPage: publishPreferencesPage,
  },
};
