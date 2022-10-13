import KoaRouter from "koa-router";
import { IRole } from "~/lib/access-control/types";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import roles from "~/lib/user-roles";
import requireCapability from "./middleware/require-capability";

const router = new KoaRouter();

router.get("/:id", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const role = await roles(tenantId).get(id);

  if (!role) {
    throw new NotFound();
  }

  ctx.body = role;
});

router.delete("/:id", requireCapability("tenant:WriteItem"), async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;

  await roles(tenantId).delete(id);
  ctx.status = 204;
});

router.get("/", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const list = await roles(tenantId).list();

  ctx.body = {
    roles: list,
  };
});

router.put("/", requireCapability("tenant:WriteItem"), async (ctx) => {
  const { tenantId } = ctx.userContext;
  const role = assertBody<IRole>(ctx.request.body);

  await roles(tenantId).replace(role);
  ctx.status = 204;
});

export default router;
