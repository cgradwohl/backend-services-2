import { MethodNotAllowed } from "~/lib/http-errors";
import { ApiRequestContext, handleApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import get from "./get";
import list from "./list";

const handlers = {
  GET: async (context: ApiRequestContext) => {
    if (context.event.pathParameters && context.event.pathParameters.id) {
      return get(context);
    }
    return list(context);
  },
};

export default handleApi<any>(
  instrumentApi<any>(async (context) => {
    const method = context.event.httpMethod;
    const handler = handlers[method];

    if (!handler) {
      throw new MethodNotAllowed();
    }

    return handler(context);
  })
);
