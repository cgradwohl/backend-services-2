import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";
import { Unauthorized } from "~/lib/http-errors";
import ForbiddenError from "~/lib/http-errors/forbidden";
import * as accessRights from "~/lib/tenant-access-rights-service";
import roles from "~/lib/user-roles";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;
type Next = () => Promise<void>;
const setUserRoleMiddleware = async (context: Context, next: Next) => {
  const { tenantId, userId } = context.userContext;
  if (!tenantId || !userId) {
    throw new Unauthorized();
  }

  const accessRight = await accessRights.get({ tenantId, userId });
  if (!accessRight) {
    throw new ForbiddenError("Forbidden");
  }

  const role = await roles(tenantId).get(accessRight.role ?? "MANAGER");

  context.userContext = {
    ...context.userContext,
    role,
  };
  await next();
};

export default setUserRoleMiddleware;
