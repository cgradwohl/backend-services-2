import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;

const validEnvironments: ReadonlyArray<string> = ["test"];

/*
Must be placed after get-user-context so we have the tenantId available.
*/
export default async (context: Context, next: () => Promise<void>) => {
  const {
    request,
    userContext: { tenantId },
  } = context;

  const validEnvironment = validEnvironments.find(
    (env) => request.url.match(`\/studio[-a-zA-Z]*\/(${env})`)?.length
  );
  if (validEnvironment) {
    context.userContext = {
      ...context.userContext,
      tenantId: `${tenantId}/${validEnvironment}`,
    };
  }

  await next();
};
