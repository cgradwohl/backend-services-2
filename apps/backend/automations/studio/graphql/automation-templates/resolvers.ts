import { emitAutomationTemplatePublishedEvent } from "~/auditing/services/emit";
import { AuditEventTarget } from "~/auditing/types";
import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";

const templateObjtype = "automation-template";
const scheduleItemObjtype = "automation-schedule-item";
const sourceObjtype = "automation-source";

const deleteAutomationTemplate: IResolver = async (_, args, context) => {
  const templateId = args.templateId;
  await context.dataSources.automationTemplates.delete(templateId);
  return templateId;
};

const automationTemplate: IResolver = async (_, args, context) => {
  const templateId = args?.templateId;
  return templateId
    ? context.dataSources.automationTemplates.get(templateId)
    : null;
};

const automationTemplates: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTemplates.list();
  return toConnection(response.items);
};

const publishAutomationTemplate: IResolver = async (_, args, context) => {
  const templateId = args?.templateId;

  if (templateId) {
    const response = await context.dataSources.automationTemplates.publish(
      templateId
    );

    // emit audit event
    const { tenantId, user, scope } = context;
    const actor: { id: string; email: string } = {
      email: user?.email ?? "",
      id: user?.id ?? "",
    };
    const target: AuditEventTarget = {
      id: templateId,
    };
    await emitAutomationTemplatePublishedEvent(
      scope,
      new Date(),
      actor,
      tenantId,
      target
    );

    return response;
  }

  return null;
};

const saveAutomationTemplate: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTemplates.save(
    args.template
  );

  return response;
};

const updateAutomationTemplateName: IResolver = async (_, args, context) => {
  const name = args?.name;
  const templateId = args?.templateId;
  const updatedAt = await context.dataSources.automationTemplates.updateName(
    name,
    templateId
  );
  return { name, templateId, updatedAt };
};

const updateCancelationToken: IResolver = async (_, args, context) => {
  const token = args?.token;
  const templateId = args?.templateId;
  const updatedAt =
    await context.dataSources.automationTemplates.updateCancelationToken(
      token,
      templateId
    );
  return { token, templateId, updatedAt };
};

const updateAlias: IResolver = async (_, args, context) => {
  const alias = args?.alias;
  const templateId = args?.templateId;

  try {
    const updatedAt = await context.dataSources.automationTemplates.updateAlias(
      alias,
      templateId
    );

    return { alias, templateId, updatedAt };
  } catch (error) {
    throw new Error(error);
  }
};

const automationSchedule: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTemplates.getSchedule(
    args.templateId
  );

  return toConnection(response.nodes);
};

const saveAutomationScheduleItem: IResolver = async (_, args, context) =>
  context.dataSources.automationTemplates.saveScheduleItem(args.item);

const deleteAutomationScheduleItem: IResolver = async (_, args, context) => {
  const itemId = args.itemId;

  await context.dataSources.automationTemplates.deleteScheduleItem(
    args.templateId,
    itemId
  );
  return itemId;
};

const automationSources: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTemplates.getSources(
    args.templateId
  );

  return toConnection(response.nodes);
};

const saveAutomationSource: IResolver = async (_, args, context) =>
  context.dataSources.automationTemplates.saveSource(
    args.templateId,
    args.newSource,
    args.oldSource
  );

const deleteAutomationSource: IResolver = async (_, args, context) => {
  const source = args.source;

  await context.dataSources.automationTemplates.deleteSource(
    args.templateId,
    source
  );
  return source;
};

export default {
  Query: {
    automationTemplate,
    automationTemplates,
    automationSchedule,
    automationSources,
  },

  Mutation: {
    deleteAutomationTemplate,
    publishAutomationTemplate,
    saveAutomationTemplate,
    updateAutomationTemplateName,
    updateCancelationToken,
    updateAlias,
    saveAutomationScheduleItem,
    deleteAutomationScheduleItem,
    saveAutomationSource,
    deleteAutomationSource,
  },

  AutomationTemplate: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === templateObjtype;
    },
  },

  ScheduleItem: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === scheduleItemObjtype;
    },
  },

  AutomationSource: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === sourceObjtype;
    },
  },
};
