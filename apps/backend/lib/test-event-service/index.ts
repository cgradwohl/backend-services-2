import jsonStore from "~/lib/s3";
import { ITestEvent } from "~/types.api";
import { NotFound } from "~/lib/http-errors";

const { put: putTestEvents, get: getTestEvents } = jsonStore<Array<ITestEvent>>(
  process.env.S3_TEST_EVENTS_BUCKET
);

export const save = async ({
  tenantId,
  id,
  testEvents,
}: {
  tenantId: string;
  id: string;
  testEvents: Array<ITestEvent>;
}) => {
  await putTestEvents(`${tenantId}/${id}`, testEvents);
};

export const get = async ({
  tenantId,
  id,
}: {
  tenantId: string;
  id: string;
}) => {
  try {
    const result = await getTestEvents(`${tenantId}/${id}`);
    return result;
  } catch (err) {
    if (err instanceof NotFound) {
      return [];
    }
    throw err;
  }
};

export const add = async ({
  tenantId,
  id,
  testEvent,
}: {
  tenantId: string;
  id: string;
  testEvent: ITestEvent;
}) => {
  const result = await get({
    tenantId,
    id,
  });

  const newTestEvents = [...result, testEvent];

  await save({
    tenantId,
    id,
    testEvents: newTestEvents,
  });
};
