import KoaRouter from "koa-router";
import * as tags from "~/lib/tags-service";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { ITag } from "~/types.api";
import tagValidator from "./validators/tag";

const tagsRouter = new KoaRouter();

tagsRouter.delete("/:id", async ctx => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const result = await tags.remove({ id, tenantId });
  ctx.body = result;
  // listen to table - have lambda that gets afflicted things and processes them
  // this should technically solve all instances of "zombie" tagIds in notifications
});

tagsRouter.put("/:id", async ctx => {
  const id = assertPathParam(ctx, "id");
  const object = assertBody(ctx) as ITag;
  tagValidator(object);

  const { tenantId } = ctx.userContext;
  ctx.body = await tags.update({ id, tenantId }, object);
});

tagsRouter.post("/", async ctx => {
  const object = assertBody(ctx) as ITag;
  tagValidator(object);

  const { tenantId } = ctx.userContext;
  object.tenantId = tenantId;
  ctx.body = await tags.create(object);
});

tagsRouter.get("/", async ctx => {
  const { tenantId } = ctx.userContext;
  const list = await tags.list(tenantId);
  ctx.body = list;
});

export default tagsRouter;
