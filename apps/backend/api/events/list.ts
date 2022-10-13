import { toApiKey } from "~/lib/api-key-uuid";
import { list as listEvents } from "~/lib/event-maps";
import { IApiEventsListResponse } from "~/types.public";
import { ListFn } from "./types";

const list: ListFn = async (context) => {
  const { tenantId } = context;
  const events = await listEvents({ tenantId });

  const results: IApiEventsListResponse["results"] = events.map((event) => ({
    event: event.eventId,
    id: toApiKey(event.notifications[0]?.notificationId) ?? "",
    type: "notification",
  }));

  const body: IApiEventsListResponse = { results };
  return { body };
};

export default list;
