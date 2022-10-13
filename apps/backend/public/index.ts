import koaCors from "@koa/cors";
import Koa from "koa";
import koaBody from "koa-body";
import KoaRouter from "koa-router";

import getCorsOrigin from "~/lib/get-cors-origin";
import { koaHandler } from "../lib/koa-handler";
import captureException from "../studio/capture-exception";
import ssoCommunity from "./sso/community";
import users from "./users";

const app = new Koa();
const router = new KoaRouter({
  prefix: "/public",
});

const origin = getCorsOrigin();

app.use(koaBody());
app.use(
  koaCors({
    origin,
  })
);
app.use(captureException);

router.use(
  "/sso/community",
  ssoCommunity.routes(),
  ssoCommunity.allowedMethods()
);

router.use("/users", users.routes(), users.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());

export const handler = koaHandler(app);
