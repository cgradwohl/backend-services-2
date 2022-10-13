import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";

import { Forbidden } from "~/lib/http-errors";

/*
Usage:

import checkFlagVariationMiddlware from "~/studio/middleware/check-flag";

router.get("/", checkFlagVariationMiddlware("flag"), async (ctx) => {
  ...
});

router.get("/", checkFlagVariationMiddlware(
  "flag",
  "variation"
), async (ctx) => {
  ...
});
*/

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;
type Next = () => Promise<void>;

const checkFlagVariationMiddlware = (
  flag: string,
  variation: any = true
) => async (context: Context, next: Next) => {
  const response = await context.variation(flag);

  if (response !== variation) {
    throw new Forbidden();
  }

  await next();
};

export default checkFlagVariationMiddlware;
