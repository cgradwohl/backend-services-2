// Preference Template will be renamed to  Subscription Topic in the future
import { PreferenceSection } from "~/client-routes/graphql/preferences/sections/resolver";
import { IContext, IResolver } from "~/client-routes/graphql/types";
import { toApiKey } from "~/lib/api-key-uuid";
import { objType } from "~/preferences/services/dynamo-service";
import {
  getRecipientPreferences,
  PreferenceTemplate,
  updatePreferences,
} from "~/preferences/studio/graphql/templates/resolvers";
import { IPreferenceTemplate } from "~/preferences/types";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IBrand } from "~/types.api";
import { RecipientPreferences } from "~/types.public";

const getPreferenceTemplate: IResolver<IBrand, IContext> = async (
  source,
  _,
  context
) => {
  const [response, lastEvaluatedKey] =
    await context.dataSources.preferenceTemplates.getPreferenceTemplatesByIds(
      source.settings.inapp?.preferences?.templateIds ?? []
    );

  return toConnection<RecipientPreferences>(
    response.filter(Boolean), // filter out empty | null templates
    lastEvaluatedKey
  );
};

const getPreferenceGroupsBySectionId: IResolver<PreferenceSection> = (source) =>
  toConnection<IPreferenceTemplate>(
    source.topics.map((topic) => ({
      ...topic,
      templateId: toApiKey(topic.templateId),
      id: createEncodedId(topic.templateId, objType),
    }))
  );

export const preferences = {
  Brand: {
    preferenceTemplates: getPreferenceTemplate,
  },
  Mutation: { updatePreferences },
  Query: {
    recipientPreferences: getRecipientPreferences,
  },
  PreferenceTemplate,
  PreferenceSection: {
    // preferenceGroups IS DEPRECATED: will be removed in the future
    preferenceGroups: getPreferenceGroupsBySectionId,
    topics: getPreferenceGroupsBySectionId,
  },
};
