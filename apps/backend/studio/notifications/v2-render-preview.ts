import KoaRouter from "koa-router";
import { koaHandler } from "~/lib/koa-handler";

import app from "../app";
import { previewMessage } from "~/send/preview";

const studio = new KoaRouter({
  prefix: "/studio",
});
const notificationsRouter = new KoaRouter();

notificationsRouter.post("/preview", async (ctx) => {
  const { tenantId } = ctx.userContext;

  const previewedMessage = await previewMessage(
    tenantId,
    ctx.request.body.message
  );
  ctx.body = previewedMessage;
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
