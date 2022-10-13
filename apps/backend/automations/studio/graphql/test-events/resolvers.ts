import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";

const objtype = "automation-test-event";

const automationTestEvents: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTestEvents.list(
    args.templateId
  );
  return toConnection(response.items);
};

const deleteAutomationTestEvent: IResolver = async (_, args, context) => {
  const removedTemplateId = await context.dataSources.automationTestEvents.remove(
    args.templateId,
    args.testEventId
  );

  return removedTemplateId;
};

const renderAutomationTemplate: IResolver = async (_, args, context) => {
  const testEvent = JSON.parse(args.testEvent);
  const renderedAutomationTemplate = await context.dataSources.automationTemplates.render(
    args.template,
    testEvent.data,
    testEvent.profile
  );

  return JSON.stringify(renderedAutomationTemplate, null, 2);
};

const saveAutomationTestEvent: IResolver = async (_, args, context) => {
  const response = await context.dataSources.automationTestEvents.save(
    args.templateId,
    args.testEvent
  );

  return response;
};

export default {
  Query: {
    automationTestEvents,
    renderAutomationTemplate,
  },

  Mutation: {
    saveAutomationTestEvent,
    deleteAutomationTestEvent,
  },

  AutomationTestEvent: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },
};
