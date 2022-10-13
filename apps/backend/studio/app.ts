import koaCors from "@koa/cors";
import Koa from "koa";
import koaBody from "koa-body";
import koaHelmet from "koa-helmet";

import getCorsOrigin from "~/lib/get-cors-origin";
import {
  getTenantContextMiddleware,
  getUserContextMiddleware,
  setTenantEnvironmentMiddleware,
  verifyJwtMiddleware,
} from "../lib/middleware";
import captureException from "./capture-exception";
import setUserRoleMiddleware from "./middleware/set-user-role";
import setVariationMiddleware from "./middleware/set-variation";
import { STS_MAX_AGE } from "~/lib/required-security-headers";

const app = new Koa();

const origin = getCorsOrigin();

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

export default app;
