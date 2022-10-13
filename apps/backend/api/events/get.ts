import { toApiKey } from "~/lib/api-key-uuid";
import { get as getEvent } from "~/lib/event-maps";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { IApiEventsGetResponse } from "~/types.public";
import { GetFn } from "./types";

const get: GetFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const event = await getEvent({ eventId: id, tenantId });

  if (!event) {
    throw new NotFound();
  }

  const body: IApiEventsGetResponse = {
    id: toApiKey(event.notifications[0]?.notificationId) ?? "",
    type: "notification",
  };
  return { body };
};

export default get;
