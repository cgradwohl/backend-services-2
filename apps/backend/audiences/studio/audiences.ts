import KoaRouter from "koa-router";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { AudienceService } from "../services";
import { FilterConfig } from "../stores/dynamo/types";

const audiences = new KoaRouter();

audiences.put("/", async (ctx) => {
  const { audienceId, name, filter } = assertBody(ctx) as {
    audienceId: string;
    name: string;
    filter: FilterConfig;
  };
  const { tenantId: envScopedTenantId } = ctx.userContext;

  const audienceService = new AudienceService(envScopedTenantId);

  await audienceService.updateAudience({
    id: audienceId,
    name,
    description: "",
    // Intentionally not setting the filter here because when we create a new from UI, it's empty.
    filter: filter ?? null,
  });

  ctx.status = 201;
});

audiences.get("/:id/members", async (ctx) => {
  const audienceId = assertPathParam(ctx, "id");
  const { tenantId: envScopedTenantId } = ctx.userContext;
  const { cursor: incomingCursor } = ctx.request.query;

  const audienceService = new AudienceService(envScopedTenantId);
  const audience = await audienceService.getAudience(audienceId);

  const pageSize = 25;

  if (!audience) {
    ctx.body = {
      items: [],
      cursor: null,
    };
  } else {
    const {
      items,
      paging: { cursor },
    } = await audienceService.listAudienceMembers(
      audienceId,
      audience.version,
      incomingCursor,
      pageSize
    );

    ctx.body = {
      items,
      cursor,
    };
  }
});

audiences.get("/:id", async (ctx) => {
  const audienceId = assertPathParam(ctx, "id");
  const { tenantId: envScopedTenantId } = ctx.userContext;

  const audienceService = new AudienceService(envScopedTenantId);
  const audience = await audienceService.getAudience(audienceId);

  if (!audience) {
    throw new NotFound();
  }

  const audienceCalcStatus = await audienceService.getAudienceCalStatus(
    audienceId,
    audience.version
  );

  ctx.body = {
    ...audience,
    users: audienceCalcStatus?.userCount ?? null,
    usersFiltered: audienceCalcStatus?.totalUsersFiltered ?? null,
    result: audienceCalcStatus?.result ?? null,
  };
});

export default audiences;
