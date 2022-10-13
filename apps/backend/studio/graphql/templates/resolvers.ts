import { IResolver } from "../types";
import decodeId from "../lib/decode-id";
import toConnection from "../lib/to-connection";

const objtype = "template";

const draft: IResolver<{ draftId: string }> = async (source, _, context) => {
  const draftId = source?.draftId;
  return draftId ? context.dataSources.templates.getDraft(draftId) : null;
};

const eventMaps: IResolver<{ templateId: string }> = async (
  source,
  _,
  context
) => {
  const templateId = source?.templateId;
  if (!templateId) {
    return [];
  }

  const list = await context.dataSources.templates.getEventMaps(templateId);
  return toConnection(list);
};

const template: IResolver = async (_, args, context) => {
  const templateId = args?.templateId;
  return templateId ? context.dataSources.templates.get(templateId) : null;
};

const addPrebuiltTemplate: IResolver = async (_, args, context) => {
  return context.dataSources.templates.addPrebuiltTemplate(args.templateName);
};

const getTemplatesBySubscriptionId: IResolver<{
  templateId: string;
}> = async (source, _, context) =>
  toConnection(
    ...(await context.dataSources.templates.getTemplatesBySubscriptionId(
      source.templateId
    ))
  );

export default {
  PreferenceTemplate: {
    notificationTemplates: getTemplatesBySubscriptionId,
  },
  Query: {
    template,
  },

  Mutation: {
    addPrebuiltTemplate,
  },

  Template: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },

    draft,
    eventMaps,
  },
};
