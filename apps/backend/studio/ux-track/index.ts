import KoaRouter from "koa-router";
import { assertBody, assertPathParam } from "~/lib/koa-assert";

import log, { error } from "~/lib/log";
import { sendTrackEvent } from "~/lib/segment";

const uxTrack = new KoaRouter();

uxTrack.post("/:key", async (context) => {
  try {
    const { tenantId, userId } = context.userContext;
    //                                    (parameter) context: ParameterizedContext<any, KoaRouter.IRouterParamContext<any, {}>, any>
    const body = assertBody(context) as any;
    const key = assertPathParam(context, "key");

    await sendTrackEvent({
      body,
      key,
      tenantId,
      userId,
    });
  } catch (e) {
    error(e && e.message ? e.message : e);
  } finally {
    context.status = 200;
  }
});

export default uxTrack;
