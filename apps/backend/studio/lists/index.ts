import KoaRouter from "koa-router";
import { transformRequest as transformCursorRequest } from "~/api/transforms/cursor";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import {
  archive as archiveListItem,
  get as getList,
  list as getLists,
  put as putListItem,
} from "~/lib/lists";
import { InvalidListSearchPatternError } from "~/lib/lists/errors";
import requireCapabilityMiddleware from "../middleware/require-capability";

const router = new KoaRouter();

router.post("/", async (ctx) => {
  const { listId, listName } = assertBody(ctx) as {
    listId: string;
    listName: string;
  };
  const { tenantId: envScopedTenantId, userId } = ctx.userContext;

  await putListItem(envScopedTenantId, userId, {
    id: listId,
    name: listName,
  });

  ctx.status = 201;
});

router.get("/:id", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const list = await getList(tenantId, id);

  if (!list) {
    throw new NotFound(`List ${id} not found`);
  }

  ctx.body = list;
});

router.get("/", async (ctx) => {
  const { cursor, pattern } = ctx.request.query;
  const { tenantId } = ctx.userContext;

  try {
    const exclusiveStartKey = transformCursorRequest(cursor);
    const { items, lastEvaluatedKey } = await getLists(tenantId, {
      exclusiveStartKey,
      pattern,
    });

    ctx.body = {
      items,
      nextPageUrl: lastEvaluatedKey
        ? `/studio/lists?exclusiveStartKey=${lastEvaluatedKey.id}`
        : null,
    };
  } catch (err) {
    if (err instanceof NotFound) {
      ctx.body = {
        items: [],
        nextPageUrl: null,
      };
      return;
    }

    if (
      err instanceof InvalidListSearchPatternError ||
      err instanceof SyntaxError
    ) {
      throw new BadRequest(err.message);
    }
    throw err;
  }
});

router.delete(
  "/:id",
  requireCapabilityMiddleware("list:WriteItem", { resourceIdentifier: "id" }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    await archiveListItem(tenantId, userId, id);
    ctx.status = 204;
  }
);

export default router;
