import koaCors from "@koa/cors";
import Koa from "koa";
import koaBody from "koa-body";
import KoaRouter from "koa-router";
import getCorsOrigin from "~/lib/get-cors-origin";
import captureException from "~/studio/capture-exception";
import { koaHandler } from "~/lib/koa-handler";
import { assertBody } from "~/lib/koa-assert";
import { WorkOsWebhook } from "./webhook-types";
import { verifyWorkOsWebhookSignature } from "./verify-webhook-signature";
import { handleWorkOsWebhook } from "./webhook-handler";

const app = new Koa();
const router = new KoaRouter();

const origin = getCorsOrigin();

app.use(koaBody());
app.use(
  koaCors({
    origin,
  })
);
app.use(captureException);

router.post("/workos/webhook", async (ctx) => {
  const sig = ctx.headers["workos-signature"];
  const body: WorkOsWebhook = assertBody(ctx);
  const timestamp = verifyWorkOsWebhookSignature(sig, body);
  await handleWorkOsWebhook(body, timestamp);
  ctx.status = 200;
});

app.use(router.routes()).use(router.allowedMethods());

export const handler = koaHandler(app);
