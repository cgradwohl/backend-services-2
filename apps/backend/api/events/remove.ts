import { remove as removeEvent } from "~/lib/event-maps";
import { assertPathParam } from "~/lib/lambda-response";
import { RemoveFn } from "./types";

const remove: RemoveFn = async context => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  await removeEvent({ eventId: id, tenantId });
  return { status: 204 };
};

export default remove;
