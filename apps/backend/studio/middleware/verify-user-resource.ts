import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";
import { Forbidden } from "~/lib/http-errors";
import * as tenantAccessRightsService from "~/lib/tenant-access-rights-service";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;
type Next = () => Promise<void>;

const requireUserResourceAccessMiddleware = () => {
  return async (context: Context, next: Next) => {
    const { tenantId } = context.userContext;
    const userId = context.params.id;

    if (!tenantId || !userId) {
      throw new Forbidden();
    }

    // validate requested user resource belongs to the tenant
    const accessRight = await tenantAccessRightsService.get({
      tenantId,
      userId,
    });
    if (!accessRight) {
      throw new Forbidden();
    }

    await next();
  };
};

export default requireUserResourceAccessMiddleware;
