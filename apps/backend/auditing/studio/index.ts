import koaCors from "@koa/cors";
import Koa from "koa";
import koaBody from "koa-body";
import koaHelmet from "koa-helmet";
import KoaRouter from "koa-router";

import getCorsOrigin from "~/lib/get-cors-origin";
import { koaHandler } from "~/lib/koa-handler";
import {
  getTenantContextMiddleware,
  getUserContextMiddleware,
  setTenantEnvironmentMiddleware,
  verifyJwtMiddleware,
} from "~/lib/middleware";
import { STS_MAX_AGE } from "~/lib/required-security-headers";
import captureException from "~/studio/capture-exception";
import setUserRoleMiddleware from "~/studio/middleware/set-user-role";
import setVariationMiddleware from "~/studio/middleware/set-variation";
import auditEvents from "./audit-events";

const endpointPrefix = "/studio-auditing";

const app = new Koa();
const studio = new KoaRouter({
  prefix: endpointPrefix,
});

const origin = getCorsOrigin();

const environmentAwareRoutes: ReadonlyMap<string, KoaRouter<any, {}>> = new Map(
  [["audit-events", auditEvents]]
);

// required security headers (do not change)
app.use(koaHelmet.hidePoweredBy());
app.use(koaHelmet.hsts({ maxAge: STS_MAX_AGE }));
app.use(koaHelmet.noSniff());
// end required security headers

app.use(koaBody());
app.use(
  koaCors({
    origin,
  })
);

// TODO we prob need more env vars
// figure out if thats the case for audiences too
app.use(getUserContextMiddleware);
app.use(getTenantContextMiddleware);
app.use(verifyJwtMiddleware);
app.use(setUserRoleMiddleware);
app.use(setTenantEnvironmentMiddleware);
app.use(setVariationMiddleware);
app.use(captureException);

for (const [name, router] of environmentAwareRoutes.entries()) {
  const routes = router.routes();
  const allowedMethods = router.allowedMethods();
  studio.use(`/:environment/${name}`, routes, allowedMethods);
  studio.use(`/${name}`, routes, allowedMethods);
}

app.use(studio.routes()).use(studio.allowedMethods());

export const handler = koaHandler(app);
