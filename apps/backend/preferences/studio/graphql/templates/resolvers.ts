import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { isAfter } from "date-fns";
import { IPreferenceSection } from "~/preferences//types";
import { objType } from "~/preferences/services/dynamo-service";
import {
  IPreferenceAttachmentResponse,
  IPreferenceTemplate,
  IPreferenceTemplateAttachment,
  Rule,
} from "~/preferences/types";
import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";
import {
  ChannelClassification,
  PreferenceStatus,
  RecipientPreferences,
} from "~/types.public";

const getPreferenceTemplate: IResolver = (_, args: { id: string }, context) =>
  context.dataSources.preferenceTemplates.get(args.id);

const getPreferenceTemplates: IResolver = async (_, __, context) =>
  toConnection<IPreferenceTemplate>(
    ...(await context.dataSources.preferenceTemplates.listTemplates())
  );

const savePreferenceTemplate: IResolver = (
  _,
  args: { template: IPreferenceTemplate; isCopying: boolean },
  context
) =>
  context.dataSources.preferenceTemplates.save(args.template, args?.isCopying);

const attachResourceToPreferenceTemplate: IResolver = (
  _,
  { templateId, resourceId, resourceType }: IPreferenceTemplateAttachment,
  context
): Promise<IPreferenceAttachmentResponse> => {
  return context.dataSources.preferenceTemplates.attachResourceToTemplate({
    resourceId,
    resourceType,
    templateId,
  });
};

export const updatePreferences: IResolver = async (
  _,
  {
    templateId,
    preferences,
  }: {
    templateId: string;
    preferences: {
      status: PreferenceStatus;
      snooze: Rule[];
      channel_preferences: ChannelClassification[];
      // This one is user decided routing preferences. If we see user specified routing preferences, we will use that in send pipeline.
      // user provided routing preferences will have the highest priority.
      routingPreferences: ChannelClassification[];
      hasCustomRouting: boolean;
    };
  },
  context
): Promise<void> => {
  await context.dataSources.preferenceTemplates.attachResourceToTemplate({
    resourceId: context.user.id,
    resourceType: "recipients",
    templateId,
    value: preferences,
  });
};

export const getRecipientPreferences: IResolver = async (_, __, context) =>
  toConnection<RecipientPreferences>(
    ...(await context.dataSources.preferenceTemplates.listRecipientPreferences(
      context.user.id
    ))
  );

export const PreferenceTemplate = {
  __isTypeOf: (source: { id: string }) => {
    return decodeId(source?.id)?.objtype === objType;
  },
};

const getPreferenceGroupsBySectionId: IResolver<IPreferenceSection> = async (
  source,
  _,
  context
) => {
  const [topics, lastEvaluatedKey]: [
    Array<IPreferenceTemplate>,
    DocumentClient.Key
  ] = await context.dataSources.preferenceTemplates.listGroupsBySection(
    source.sectionId
  );
  return toConnection(
    topics.map((topic) => ({
      ...topic,
      isPublished: source?.publishedAt
        ? isAfter(new Date(source.publishedAt), new Date(topic.updated))
        : false,
    })),
    lastEvaluatedKey
  );
};
export default {
  PreferenceSection: {
    preferenceGroups: getPreferenceGroupsBySectionId,
  },
  Query: {
    preferenceTemplate: getPreferenceTemplate,
    preferenceTemplates: getPreferenceTemplates,
  },

  Mutation: {
    attachResourceToPreferenceTemplate,
    savePreferenceTemplate,
  },

  PreferenceTemplate,
};
