import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";

import { get as getTenant } from "~/lib/tenant-service";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;

/*
Must be placed after get-user-context so we have the tenantId available.
*/
export default async (context: Context, next: () => Promise<void>) => {
  const {
    userContext: { tenantId },
  } = context;

  try {
    const tenant = await getTenant(tenantId);
    context.tenantContext = tenant;
  } catch {
    // we don't always have a tenant.  specifically when you are a new user and you want to join
    // a tenant vs creating a new one.
  }

  await next();
};
