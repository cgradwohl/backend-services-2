import KoaRouter from "koa-router";
import { ValueJSON } from "slate";

import * as checkService from "~/lib/check-service/index";
import { getUser } from "~/lib/cognito";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { rateLimitMiddleware } from "~/lib/middleware";
import * as notificationService from "~/lib/notification-service";
import * as testEventService from "~/lib/test-event-service/index";

import * as notificationDraftService from "~/lib/notification-service/draft";
import notes from "~/lib/notification-service/notes";
import { sendTrackEvent } from "~/lib/segment";
import shareSnippet from "~/lib/share-snippet";
import getApiKey from "~/lib/tenant-service/get-api-key";
import requireCapabilityMiddleware from "../middleware/require-capability";

import { toUuid } from "~/lib/api-key-uuid";
import courierHttp from "~/lib/courier-http";
import { exportElemental } from "~/lib/notification-service/export-elemental";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { CourierObject, INotificationWire, ITestEvent } from "~/types.api";
import drafts from "./drafts";
import { notificationValidator } from "./validate";

const notificationsRouter = new KoaRouter();
notificationsRouter.use("/drafts", drafts.routes(), drafts.allowedMethods());

const fetchNotificationsRecursive = async (
  tenantId: string,
  exclusiveStartKey?: any
) => {
  const { lastEvaluatedKey, objects } = await notificationService.list({
    exclusiveStartKey,
    tenantId,
  });

  if (lastEvaluatedKey) {
    const more = await fetchNotificationsRecursive(tenantId, lastEvaluatedKey);
    return [...objects, ...more];
  }

  return objects;
};

notificationsRouter.get("/", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const objects = await fetchNotificationsRecursive(tenantId);
  ctx.body = { objects };
});

notificationsRouter.get("/:id/drafts", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const list = await notificationDraftService.list(
    {
      ExpressionAttributeValues: {
        ":notificationId": id,
      },
      FilterExpression: `begins_with(id, :notificationId)`,
      tenantId,
    },
    {
      limit: 25,
    }
  );

  ctx.body = list.objects;
});

notificationsRouter.get("/:id", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const notification = await notificationService.get({ id, tenantId });
  ctx.body = notification;
});

notificationsRouter.put("/:id/test-events", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { testEvents } = assertBody<{ testEvents: ITestEvent[] }>(ctx);
  const { tenantId } = ctx.userContext;

  await testEventService.save({ id, tenantId, testEvents });
  ctx.status = 204;
});

notificationsRouter.post("/:id/test-event", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { testEvent } = assertBody<{ testEvent: ITestEvent }>(ctx);
  const { tenantId } = ctx.userContext;

  await testEventService.add({ id, tenantId, testEvent });
  ctx.status = 204;
});

notificationsRouter.get("/:id/test-events", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;

  ctx.body = await testEventService.get({ id, tenantId });
});

notificationsRouter.get("/:id/draft", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const notification = await notificationService.get({ id, tenantId });

  let draft;
  if (notification.json.draftId) {
    draft = await notificationDraftService.get({
      id: notification.json.draftId,
      tenantId,
    });
  } else {
    draft = {
      json: {
        blocks: notification.json.blocks,
        brandConfig: notification.json.brandConfig,
        channels: notification.json.channels,
        notificationId: notification.id,
      },
      title: "Untitled Draft",
    };
  }

  ctx.body = draft;
});

notificationsRouter.post(
  "/:id/duplicate",
  requireCapabilityMiddleware("template:WriteItem"),
  rateLimitMiddleware("objects"),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const notificationToDuplicate = await notificationService.get({
      id,
      tenantId,
    });

    if (notificationToDuplicate.json.draftId) {
      const notificationDraft = await notificationDraftService.get({
        id: notificationToDuplicate.json.draftId,
        tenantId,
      });

      notificationToDuplicate.json = {
        ...notificationToDuplicate.json,
        blocks: notificationDraft.json.blocks,
        brandConfig: notificationDraft.json.brandConfig,
        channels: notificationDraft.json.channels,
        draftId: undefined,
      };
    }

    ctx.body = await notificationService.create(
      { tenantId, userId },
      {
        ...notificationToDuplicate,
        id: undefined,
        title: `${notificationToDuplicate.title} COPY`,
      }
    );
  }
);

notificationsRouter.post(
  "/",
  requireCapabilityMiddleware("template:WriteItem"),
  rateLimitMiddleware("objects"),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;
    const object = assertBody<INotificationWire>(
      ctx,
      notificationValidator.validate
    );

    const result = await notificationService.create(
      { tenantId, userId },
      object
    );

    if (object.json.preferenceTemplateId) {
      await preferenceTemplateService(tenantId, "").updatePreferences({
        resourceId: result.id,
        resourceType: "notifications",
        templateId: toUuid(object.json?.preferenceTemplateId),
      });
    }

    await sendTrackEvent({
      body: result,
      key: "notification-created",
      tenantId,
      userId,
    });

    ctx.body = result;
  }
);

notificationsRouter.del(
  "/:id/notes",
  requireCapabilityMiddleware("template:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;
    const id = assertPathParam(ctx, "id");
    await notes(tenantId, userId).del(id);
    ctx.status = 204;
  }
);

notificationsRouter.get("/:id/notes", async (ctx) => {
  const { tenantId, userId } = ctx.userContext;
  const id = assertPathParam(ctx, "id");
  const note = await notes(tenantId, userId).get(id);
  ctx.body = note;
});

notificationsRouter.put(
  "/:id/notes",
  requireCapabilityMiddleware("template:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const { userId, tenantId } = ctx.userContext;
    const id = assertPathParam(ctx, "id");
    const body = assertBody<{ slate: ValueJSON }>(ctx);

    if (!body.slate) {
      throw new BadRequest("slate is a required property");
    }

    await notes(tenantId, userId).put(id, body.slate);
    ctx.status = 204;
  }
);

notificationsRouter.post("/send", async (ctx) => {
  const { tenantId } = ctx.userContext;

  const authToken = await getApiKey(tenantId);
  try {
    const response = await courierHttp(authToken, {
      "X-COURIER-SOURCE": "Courier-Studio",
    }).post("/send", {
      message: ctx.request.body.message,
    });

    ctx.body = response?.data;
  } catch (ex) {
    ctx.status = 400;
    ctx.body = {
      error: String(ex),
    };
  }
});

notificationsRouter.post("/share-snippet", async (ctx) => {
  const payload = assertBody(ctx) as {
    email: string;
    snippet: string;
    language: string;
  };

  const { userId } = ctx.userContext;

  const user = await getUser(userId);

  const response = await shareSnippet({
    ...payload,
    fromEmail: user.email,
  });
  ctx.body = response;
});

notificationsRouter.put(
  "/:id",
  requireCapabilityMiddleware("template:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;

    const id = assertPathParam(ctx, "id");
    const object = assertBody<INotificationWire>(
      ctx,
      notificationValidator.validate
    );

    if (object.objtype !== "event") {
      throw new BadRequest("Invalid Object Type");
    }

    await preferenceTemplateService(tenantId, "").updatePreferences({
      resourceId: id,
      resourceType: "notifications",
      templateId: toUuid(object.json?.preferenceTemplateId),
    });

    ctx.body = await notificationService.replace(
      {
        id,
        tenantId,
        userId,
      },
      object
    );
  }
);

notificationsRouter.delete(
  "/:id",
  requireCapabilityMiddleware("template:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const result = await notificationService.archive({ id, tenantId, userId });
    ctx.body = result;
  }
);

notificationsRouter.delete("/:id/:submissionId/checks", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const submissionId = assertPathParam(ctx, "submissionId");
  const { tenantId, userId } = ctx.userContext;

  await checkService.cancelSubmission({
    id,
    submissionId,
    tenantId,
    userId,
  });

  ctx.status = 204;
});

notificationsRouter.post(
  "/:id/copy/locales",
  requireCapabilityMiddleware("template:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const notificationId = assertPathParam(ctx, "id");
    const { tenantId } = ctx.userContext;

    const { destinationDraftId, destinationEnv, destinationExists } =
      assertBody<{
        destinationDraftId: string;
        destinationEnv: "test" | "production";
        destinationExists: boolean;
      }>(ctx);

    await notificationService.copyLocales({
      destinationDraftId,
      destinationEnv,
      destinationExists,
      notificationId,
      tenantId,
    });

    ctx.status = 204;
  }
);

notificationsRouter.get("/:id/elemental", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const id = assertPathParam(ctx, "id");

  const notification = await notificationService.get({
    id: toUuid(id),
    tenantId,
  });

  if (!notification) {
    throw new NotFound();
  }

  const elemental = exportElemental({ notification });

  ctx.body = elemental;
});

export default notificationsRouter;
