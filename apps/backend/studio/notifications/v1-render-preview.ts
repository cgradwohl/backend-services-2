import KoaRouter from "koa-router";
import { koaHandler } from "~/lib/koa-handler";

import app from "../app";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import renderPreviewEmail, {
  RenderPreviewEmailParams,
} from "~/lib/notifications/render-preview-email";
import { sendTrackEvent } from "~/lib/segment";
import createTraceId from "~/lib/x-ray/create-trace-id";
import {
  CourierRenderOverrides,
  SqsTestNotificationMessage,
} from "~/types.internal";
import { testNotificationValidator } from "./validate";
import enqueue from "~/lib/enqueue";
import { decode as decodeEmailSubject } from "~/lib/email-subject-encoding";
import getEnvironmentVariable from "~/lib/get-environment-variable";

const enqueueTestNotification = enqueue<SqsTestNotificationMessage>(
  getEnvironmentVariable("SQS_TEST_NOTIFICATION_QUEUE_NAME")
);

const studio = new KoaRouter({
  prefix: "/studio",
});
const notificationsRouter = new KoaRouter();

notificationsRouter.post("/:id/test", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const payload = assertBody(ctx, testNotificationValidator.validate) as {
    brandId: string;
    channelId: string;
    courier?: CourierRenderOverrides;
    data: any;
    draftId: string;
    override: any;
    previewRender: boolean;
    profile: any;
    users: string[];
  };

  const messageId = createTraceId();
  const { userId, tenantId, userPoolId } = ctx.userContext;
  const courierRenderOverrides: CourierRenderOverrides = {
    environment: (tenantId as string).includes("test") ? "test" : "production",
    scope: "published",
    ...payload?.courier,
  };

  const previewMessage: RenderPreviewEmailParams = {
    brandId: payload.brandId,
    channelId: payload.channelId,
    courier: courierRenderOverrides,
    draftId: payload.draftId,
    eventData: payload.data,
    eventProfile: payload.profile || {},
    messageId,
    notificationId: id,
    override: payload.override,
    previewRender: payload.previewRender,
    recipientId: userId,
    tenantId,
    userPoolId,
    users: payload.users,
  };

  if (payload.previewRender) {
    try {
      const { templates } = await renderPreviewEmail(previewMessage, userId);
      if (templates.subject) {
        templates.subject = decodeEmailSubject(String(templates.subject));
      }
      ctx.body = templates;
    } catch (ex) {
      console.error(ex);
      ctx.body = {
        error: String(ex),
      };
    }
    return;
  }

  if (userId) {
    await sendTrackEvent({
      body: {
        brandId: previewMessage.brandId,
        draftId: previewMessage.draftId,
        messageId,
        notificationId: previewMessage.notificationId,
        recipientId: previewMessage.recipientId,
        templateId: previewMessage.notificationId,
      },
      key: "notification-test-sent",
      tenantId: previewMessage.tenantId,
      userId,
    });
  }

  await enqueueTestNotification(previewMessage);

  ctx.body = {
    messageId,
  };
});

const environmentAwareRoutes: ReadonlyMap<string, KoaRouter<any, {}>> = new Map(
  [["notifications", notificationsRouter]]
);

for (const [name, router] of environmentAwareRoutes.entries()) {
  const routes = router.routes();
  const allowedMethods = router.allowedMethods();
  studio.use(`/:environment/${name}`, routes, allowedMethods);
  studio.use(`/${name}`, routes, allowedMethods);
}

app.use(studio.routes()).use(studio.allowedMethods());

export const handler = koaHandler(app);
