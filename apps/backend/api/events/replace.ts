import ajv from "~/lib/ajv";
import { toUuid } from "~/lib/api-key-uuid";
import { replace as replaceEvent } from "~/lib/event-maps";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { PutFn, PutRequestBody } from "./types";

const validate = ajv.compile({
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    type: {
      enum: ["notification"],
      type: "string",
    },
  },
  required: ["id", "type"],
  type: "object",
});

const replace: PutFn = async (context) => {
  const id = assertPathParam(context, "id");
  const { tenantId } = context;
  const event = assertBody<PutRequestBody>(context, { validateFn: validate });
  const notificationId = toUuid(event.id);

  await replaceEvent(
    { eventId: id, tenantId, userId: `tenant/${tenantId}` },
    { eventId: id, notifications: [{ notificationId }] }
  );

  return { body: event };
};

export default replace;
