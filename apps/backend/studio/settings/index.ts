import KoaRouter from "koa-router";

import { assertBody } from "~/lib/koa-assert";

import requireCapabilityMiddleware from "../middleware/require-capability";
import {
  setClickThroughTrackingSettings,
  setEmailOpenTrackingSettings,
} from "../tenants";
import validateClickThroughTrackingSettings from "../validators/click-through-settings";
import validateEmailOpenTrackingSettings from "../validators/email-open-settings";

import {
  IClickThroughTrackingSettings,
  IEmailOpenTrackingSettings,
} from "~/types.api";

const settingsRouter = new KoaRouter();

// Click-Through Tracking
settingsRouter.get("/click-through-tracking", async (context) => {
  const clickThroughTracking =
    context.tenantContext?.clickThroughTracking?.enabled ?? false;

  context.body = clickThroughTracking;
});

settingsRouter.post(
  "/click-through-tracking",
  requireCapabilityMiddleware("tracking:WriteSettings"),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const clickThroughTrackingSettings = assertBody(
      context
    ) as IClickThroughTrackingSettings;

    validateClickThroughTrackingSettings(clickThroughTrackingSettings);

    const clickThroughTracking = await setClickThroughTrackingSettings(
      tenantId,
      clickThroughTrackingSettings,
      userId
    );

    context.body = clickThroughTracking;
  }
);

// Email-Open Tracking
settingsRouter.get("/email-open-tracking", async (context) => {
  const emailOpenTracking =
    context.tenantContext?.emailOpenTracking?.enabled ?? false;

  context.body = emailOpenTracking;
});

settingsRouter.post(
  "/email-open-tracking",
  requireCapabilityMiddleware("tracking:WriteSettings"),
  async (context) => {
    const { tenantId } = context.userContext;
    const emailOpenTrackingSettings = assertBody(
      context
    ) as IEmailOpenTrackingSettings;

    validateEmailOpenTrackingSettings(emailOpenTrackingSettings);

    const emailOpenTracking = await setEmailOpenTrackingSettings(
      tenantId,
      emailOpenTrackingSettings
    );

    context.body = emailOpenTracking;
  }
);

export default settingsRouter;
