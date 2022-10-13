import KoaRouter from "koa-router";

import { assertBody, assertPathParam } from "~/lib/koa-assert";
import logger from "~/lib/logger";
import { sendTrackEvent } from "~/lib/segment";

const segment = new KoaRouter();

segment.post("/:key", async (context) => {
  try {
    const { tenantId, userId } = context.userContext;
    const body = assertBody(context);
    const key = assertPathParam(context, "key");
    await sendTrackEvent({ body, key, tenantId, userId });
  } catch (e) {
    logger.error(e && e.message ? e.message : e);
  } finally {
    context.status = 200;
  }
});

export default segment;
