import KoaRouter from "koa-router";
import * as categoryService from "~/lib/category-service";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { rateLimitMiddleware } from "~/lib/middleware";
import { NotificationCategory } from "~/types.api";
import requireCapabilityMiddleware from "../middleware/require-capability";
import categoryValidator from "./validate";

const router = new KoaRouter();

router.delete(
  "/:id",
  requireCapabilityMiddleware("category:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId } = ctx.userContext;
    const result = await categoryService.remove({ id, tenantId });
    ctx.body = result;
    // listen to table - have lambda that gets afflicted things and processes them
    // this should technically solve all instances of "zombie" tagIds in notifications
  }
);

router.put(
  "/:id",
  requireCapabilityMiddleware("category:WriteItem", {
    resourceIdentifier: "id",
  }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const object = assertBody(ctx) as NotificationCategory;
    categoryValidator(object);

    const { tenantId, userId } = ctx.userContext;
    const newCategory = await categoryService.replace(
      { id, tenantId, userId },
      object
    );
    ctx.body = {
      id,
      ...newCategory,
    };
  }
);

router.post(
  "/",
  requireCapabilityMiddleware("category:WriteItem"),
  rateLimitMiddleware("objects"),
  async (ctx) => {
    const object = assertBody(ctx) as NotificationCategory;
    categoryValidator(object);

    const { tenantId, userId } = ctx.userContext;
    object.tenantId = tenantId;
    ctx.body = await categoryService.create({ userId, tenantId }, object);
  }
);

router.get("/", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const list = await categoryService.list({ tenantId });
  ctx.body = list;
});

export default router;
