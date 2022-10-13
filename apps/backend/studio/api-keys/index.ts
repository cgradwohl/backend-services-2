import KoaRouter from "koa-router";
import listAuthTokens from "~/lib/tenant-service/list-api-keys";

const router = new KoaRouter();

router.get("/", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const tokens = await listAuthTokens(tenantId);

  ctx.body = tokens.map(
    ({ authToken: apiKey, created, creator, name, dryRunKey, scope }) => ({
      apiKey,
      created,
      creator,
      name,
      dryRunKey,
      scope,
    })
  );
});

export default router;
