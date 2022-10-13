import { isAfter } from "date-fns";
import { PreferencesPage } from "~/preferences/studio/graphql/page/data-source";
import {
  IPreferenceSection,
  IPreferenceSectionDataInput,
} from "~/preferences/types";
import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IContext, IResolver } from "~/studio/graphql/types";
import { objType } from "./data-source";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const addPreferenceGroup: IResolver = async (
  _,
  args: { sectionId: string; preferenceGroupId: string },
  context
) =>
  context.dataSources.preferenceSectionDataSource.add(
    args.sectionId,
    args.preferenceGroupId
  );

const savePreferenceSection: IResolver = async (
  _,
  args: { section: IPreferenceSectionDataInput },
  context
) =>
  context.dataSources.preferenceSectionDataSource.save({
    ...args.section,
  });

const deletePreferenceSection: IResolver = async (
  _,
  args: { sectionId: string },
  context
) =>
  context.dataSources.preferenceSectionDataSource.deleteSection(args.sectionId);

export const PreferenceSection = {
  __isTypeOf: (source: { id: string }) =>
    decodeId(source?.id)?.objtype === objType,
};

const getPreferenceSection: IResolver = async (_, args, context) =>
  context.dataSources.preferenceSectionDataSource.get(args.id);

const getPreferenceSections: IResolver<PreferencesPage, IContext> = async (
  source,
  __,
  context
) => {
  const [sections, lastEvaluatedKey]: [
    Array<IPreferenceSection>,
    DocumentClient.Key
  ] = await context.dataSources.preferenceSectionDataSource.list();

  return toConnection<IPreferenceSection>(
    sections.map((section) => ({
      ...section,
      publishedAt: source?.publishedAt || null,
      isPublished: source?.publishedAt
        ? isAfter(new Date(source.publishedAt), new Date(section.updated))
        : false,
    })),
    lastEvaluatedKey
  );
};

export default {
  PreferencesPage: {
    sectionsByPage: getPreferenceSections,
  },
  Query: {
    preferenceSection: getPreferenceSection,
    preferenceSections: getPreferenceSections,
  },
  Mutation: {
    addPreferenceGroup,
    savePreferenceSection,
    deletePreferenceSection,
  },
  PreferenceSection,
};
