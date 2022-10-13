import Ajv from "ajv";
import KoaRouter from "koa-router";

import * as eventMaps from "~/lib/event-maps";
import { BadRequest } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { rateLimitMiddleware } from "~/lib/middleware";
import * as Types from "~/types.api";

const eventMapsRouter = new KoaRouter();

const eventMapNotificationSchema = {
  $id: "eventMapNotification",
  additionalProperties: false,
  properties: {
    notificationId: {
      type: "string",
    },
  },
  required: ["notificationId"],
  type: "object",
};

const ajv = new Ajv({ allErrors: true, schemas: [eventMapNotificationSchema] });

const validateCreate = ajv.compile({
  additionalProperties: false,
  properties: {
    eventId: {
      type: "string",
    },
    notifications: {
      items: {
        $ref: "eventMapNotification",
      },
      type: "array",
    },
  },
  required: ["eventId", "notifications"],
  type: "object",
});

const validateUpdate = ajv.compile({
  additionalProperties: false,
  properties: {
    eventId: {
      type: "string",
    },
    notifications: {
      items: {
        $ref: "eventMapNotification",
      },
      type: "array",
    },
  },
  type: "object",
});

eventMapsRouter.get("/", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const list = await eventMaps.list({ tenantId });
  const response: Types.IEventMapsListResponse = { eventMaps: list };
  ctx.body = response;
});

eventMapsRouter.post("/", rateLimitMiddleware("objects"), async (ctx) => {
  const { tenantId, userId } = ctx.userContext;
  const body = assertBody(ctx);

  if (!validateCreate(body)) {
    throw new BadRequest(
      validateCreate.errors.map(({ message }) => message).join(". ")
    );
  }

  const { eventId, notifications = [] } = body as Types.IEventMapsCreateRequest;

  const eventMap = await eventMaps.create({
    eventId,
    notifications,
    tenantId,
    userId,
  });

  ctx.body = eventMap;
});

eventMapsRouter.delete("/:eventId", async (ctx) => {
  const eventId = assertPathParam(ctx, "eventId");
  const { tenantId } = ctx.userContext;

  await eventMaps.remove({ eventId, tenantId });

  ctx.body = { success: true };
});

eventMapsRouter.post(
  "/:eventId",
  rateLimitMiddleware("objects"),
  async (ctx) => {
    const eventId = assertPathParam(ctx, "eventId");
    const { tenantId, userId } = ctx.userContext;
    const body = assertBody(ctx);

    if (!validateUpdate(body)) {
      throw new BadRequest(
        validateUpdate.errors.map(({ message }) => message).join(". ")
      );
    }

    const { eventId: newEventId, notifications } =
      body as Types.IEventMapsUpdateRequest;

    const eventMap = await eventMaps.replace(
      { tenantId, userId, eventId },
      { eventId: newEventId, notifications }
    );

    ctx.body = eventMap;
  }
);

export default eventMapsRouter;
