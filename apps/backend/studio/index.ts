import koaCors from "@koa/cors";
import Koa from "koa";
import koaBody from "koa-body";
import koaHelmet from "koa-helmet";
import KoaRouter from "koa-router";

import getCorsOrigin from "~/lib/get-cors-origin";
import { koaHandler } from "../lib/koa-handler";
import {
  getTenantContextMiddleware,
  getUserContextMiddleware,
  setTenantEnvironmentMiddleware,
  verifyJwtMiddleware,
} from "../lib/middleware";
import apiKeys from "./api-keys";
import billing from "./billing";
import brands from "./brands";
import captureException from "./capture-exception";
import categories from "./categories";
import configurations from "./configurations";
import userRoles from "./user-roles";
import eventMaps from "./event-maps";
import intercomUserHash from "./intercom-user-hash";
import invitations from "./invitations";
import lists from "./lists";
import messages from "./messages";
import metrics from "./metrics";
import setUserRoleMiddleware from "./middleware/set-user-role";
import setVariationMiddleware from "./middleware/set-variation";
import notifications from "./notifications";
import onboarding from "./onboarding";
import profile from "./profile";
import providers from "./providers";
import segment from "./segment";
import settings from "./settings";
import uxt from "./ux-track";
import { STS_MAX_AGE } from "~/lib/required-security-headers";
import tags from "./tags";
import tenantsV2 from "./tenants-v2";
import users from "./user";

const app = new Koa();
const studio = new KoaRouter({
  prefix: "/studio",
});

const origin = getCorsOrigin();

const commonRoutes: ReadonlyMap<string, KoaRouter<any, {}>> = new Map([
  ["apikeys", apiKeys],
  ["billing", billing],
  ["configurations", configurations],
  ["intercom-user-hash", intercomUserHash],
  ["invitations", invitations],
  ["onboarding", onboarding],
  ["providers", providers],
  ["settings", settings],
  ["tenants-v2", tenantsV2],
  ["user-roles", userRoles],
  ["users", users],
  ["uxt", uxt],
]);

const environmentAwareRoutes: ReadonlyMap<string, KoaRouter<any, {}>> = new Map(
  [
    ["brands", brands],
    ["categories", categories],
    ["event-maps", eventMaps],
    ["lists", lists],
    ["messages", messages],
    ["metrics", metrics],
    ["notifications", notifications],
    ["profile", profile],
    ["segment", segment],
    ["tags", tags],
  ]
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

for (const [name, router] of commonRoutes.entries()) {
  studio.use(`/${name}`, router.routes(), router.allowedMethods());
}

app.use(studio.routes()).use(studio.allowedMethods());

export const handler = koaHandler(app);
