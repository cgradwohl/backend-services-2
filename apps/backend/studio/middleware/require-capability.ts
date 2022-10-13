import { ParameterizedContext } from "koa";
import { IRouterParamContext } from "koa-router";
import assertHasCapability, {
  CapabilityAssertionError,
} from "~/lib/access-control/assert-has-capability";
import { Action } from "~/lib/access-control/types";
import { Forbidden } from "~/lib/http-errors";

type Context = ParameterizedContext<any, IRouterParamContext<any, {}>>;
type Next = () => Promise<void>;

interface IOptions {
  resourceIdentifier?: string;
}

const requireCapabilityMiddleware = (
  capability: Action,
  options?: IOptions
) => {
  return async (context: Context, next: Next) => {
    const { role } = context.userContext;
    if (!role) {
      // a role must be provided
      throw new Forbidden();
    }

    const resourceId = options?.resourceIdentifier
      ? context.params[options.resourceIdentifier]
      : "*";
    const environment = context.params?.environment ?? "production";
    const resource = `${environment}/${resourceId}`;

    try {
      assertHasCapability(role, capability, resource);
      await next();
    } catch (err) {
      if (err instanceof CapabilityAssertionError) {
        throw new Forbidden();
      }
      throw err;
    }
  };
};

export default requireCapabilityMiddleware;
