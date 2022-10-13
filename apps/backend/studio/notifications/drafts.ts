import KoaRouter from "koa-router";
import { INotificationDraftJson } from "./../../types.api.d";

import { BadRequest } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import * as notificationDraftService from "~/lib/notification-service/draft";
import sanitize from "~/lib/notifications/sanitize";

import requireCapabilityMiddleware from "../middleware/require-capability";
import { notificationValidator } from "./validate";

import { CourierObject, INotificationWire } from "~/types.api";
const notificationDraftsRouter = new KoaRouter();

notificationDraftsRouter.get("/:id", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  ctx.body = await notificationDraftService.get({ id, tenantId });
});

notificationDraftsRouter.post(
  "/:id/publish",
  requireCapabilityMiddleware("template:WriteItem"),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;
    const id = assertPathParam(ctx, "id");

    const payload = assertBody(ctx) as {
      message: string;
      draftTitle: string;
    };

    try {
      ctx.body = await notificationDraftService.publish({
        id,
        payload,
        tenantId,
        userId,
      });
    } catch (ex) {
      if (ex instanceof notificationDraftService.DraftConflict) {
        ctx.status = 409;
        ctx.body = {
          error: String(ex),
        };
        return;
      }

      throw ex;
    }
  }
);

notificationDraftsRouter.post(
  "/",
  requireCapabilityMiddleware("template:WriteItem"),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;
    const rawDraft = assertBody<INotificationWire>(
      ctx,
      notificationValidator.validate
    ) as CourierObject;

    if (!rawDraft.json.notificationId) {
      throw new BadRequest("No Associated Notification Id");
    }

    const draft = await sanitize(rawDraft, tenantId);

    try {
      ctx.body = await notificationDraftService.create({
        draft,
        tenantId,
        userId,
      });
    } catch (ex) {
      if (ex instanceof notificationDraftService.DraftConflict) {
        ctx.status = 409;
        ctx.body = {
          error: String(ex),
        };
        return;
      }

      throw ex;
    }
  }
);

notificationDraftsRouter.put(
  "/:id",
  requireCapabilityMiddleware("template:WriteItem"),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;

    const id = assertPathParam(ctx, "id");
    const object = assertBody(
      ctx,
      notificationValidator.validate
    ) as CourierObject<INotificationDraftJson>;

    try {
      ctx.body = await notificationDraftService.replace(
        {
          id,
          tenantId,
          userId,
        },
        object
      );
    } catch (ex) {
      if (ex instanceof notificationDraftService.DraftConflict) {
        ctx.status = 409;
        ctx.body = {
          error: String(ex),
        };
        return;
      }

      throw ex;
    }
  }
);

notificationDraftsRouter.delete(
  "/:id",
  requireCapabilityMiddleware("template:WriteItem"),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const result = await notificationDraftService.archive({
      id,
      tenantId,
      userId,
    });
    ctx.body = result;
  }
);

export default notificationDraftsRouter;
