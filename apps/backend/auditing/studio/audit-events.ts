import KoaRouter from "koa-router";
import { search as fetch } from "~/auditing/services/search";
import { esResponseMapperStudio } from "~/auditing/services/search";
import assertHasCapability from "~/lib/access-control/assert-has-capability";

const auditEvents = new KoaRouter();

auditEvents.get("/", async (ctx) => {
  const { tenantId: workspaceId, role } = ctx.userContext;
  const env = ctx.params?.environment ?? "production";

  try {
    assertHasCapability(role, "auditTrail:ListItems", env);
  } catch (err) {
    ctx.body = { items: [] };
    return;
  }

  const { at, start: startString } = ctx.request.query;
  let { limit } = ctx.request.query;
  limit = limit && Number(limit);

  const start =
    startString && !isNaN(parseInt(startString, 10))
      ? parseInt(startString, 10)
      : undefined;

  const prev = ctx.request.query.prev || undefined;
  const next = ctx.request.query.next || undefined;

  const response = await fetch(
    workspaceId,
    {
      at,
      limit,
      next,
      prev,
      search: {},
      start,
    },
    esResponseMapperStudio
  );

  ctx.body = { ...response };
});

export default auditEvents;
