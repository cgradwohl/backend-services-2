import jsonStore from "~/lib/s3";
import { IAutomationTestEvent } from "../../types";
import { NotFound } from "~/lib/http-errors";
import { IAutomationTestEventsService } from "../../types";

const { put: putTestEvents, get: getTestEvents } = jsonStore<
  Array<IAutomationTestEvent>
>(process.env.S3_TEST_EVENTS_BUCKET);

export default (tenantId: string): IAutomationTestEventsService => {
  // helpers
  const updateArray = async ({
    templateId,
    testEvents,
  }: {
    templateId: string;
    testEvents: Array<IAutomationTestEvent>;
  }) => {
    await putTestEvents(`${tenantId}/${templateId}`, testEvents);
  };

  // service
  return {
    get: async (templateId: string) => {
      try {
        const result = await getTestEvents(`${tenantId}/${templateId}`);
        return result;
      } catch (err) {
        if (err instanceof NotFound) {
          return [];
        }
        throw err;
      }
    },

    remove: async (templateId: string, testEventId: string) => {
      const result = await getTestEvents(`${tenantId}/${templateId}`);

      const newTestEvents = result.filter(
        (events) => events.testEventId !== testEventId
      );

      await updateArray({
        templateId,
        testEvents: newTestEvents,
      });
    },

    save: async (templateId: string, testEvent: IAutomationTestEvent) => {
      try {
        const result = await getTestEvents(`${tenantId}/${templateId}`);
        const editedTestEventIndex = result.findIndex(
          (event) => event.testEventId === testEvent.testEventId
        );

        if (editedTestEventIndex !== -1) {
          const today = new Date();

          const updatedTestEvent = {
            ...result[editedTestEventIndex],
            label: testEvent.label,
            testEvent: testEvent.testEvent,
            updated: today.toDateString(),
          };

          const newTestEvents = [
            ...result.slice(0, editedTestEventIndex),
            updatedTestEvent,
            ...result.slice(editedTestEventIndex + 1),
          ];

          await updateArray({
            templateId,
            testEvents: newTestEvents,
          });
        } else {
          const newTestEvents = [...result, testEvent];

          await updateArray({
            templateId,
            testEvents: newTestEvents,
          });
        }
      } catch (err) {
        if (err instanceof NotFound) {
          const testEvents = [];
          testEvents.push(testEvent);
          await updateArray({
            templateId,
            testEvents,
          });
        } else {
          throw err;
        }
      }
    },
  };
};
