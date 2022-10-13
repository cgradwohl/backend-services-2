import KoaRouter from "koa-router";
import assertHasCapability from "~/lib/access-control/assert-has-capability";
import { sendTrackEvent } from "~/lib/segment";
import * as configurations from "../lib/configurations-service";
import { assertBody, assertPathParam } from "../lib/koa-assert";
import requireCapabilityMiddleware from "./middleware/require-capability";

import { CourierObject } from "../types.api";

const configurationsRouter = new KoaRouter();

configurationsRouter.get("/", async (ctx) => {
  const env = ctx.params?.environment ?? "production";
  try {
    const { role } = ctx.userContext;
    assertHasCapability(role, "integration:ListItems", env);
  } catch (err) {
    ctx.body = { objects: [] };
    return;
  }

  const { tenantId } = ctx.userContext;
  const list = await configurations.list({ tenantId });
  ctx.body = list;
});

configurationsRouter.post(
  "/",
  requireCapabilityMiddleware("integration:WriteItem"),
  async (ctx) => {
    const objectData = assertBody(ctx) as CourierObject;
    const { tenantId, userId } = ctx.userContext;
    const { id } = objectData;
    const object = await configurations.create(
      { id, tenantId, userId },
      objectData
    );

    await sendTrackEvent({
      body: object,
      key: "integration-added",
      tenantId,
      userId,
    });

    ctx.body = object;
  }
);

configurationsRouter.post(
  "/:id",
  requireCapabilityMiddleware("integration:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const objectData = assertBody(ctx) as CourierObject;
    const { tenantId, userId } = ctx.userContext;
    const object = await configurations.replace(
      { id, tenantId, userId },
      objectData
    );
    ctx.body = object;
  }
);

configurationsRouter.delete(
  "/:id",
  requireCapabilityMiddleware("integration:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const result = await configurations.archive(tenantId, id, userId);
    ctx.body = result;
  }
);

export default configurationsRouter;
