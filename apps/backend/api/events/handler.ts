import { MethodNotAllowed } from "~/lib/http-errors";
import { ApiRequestContext, handleApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import enforceRateLimit from "~/lib/rate-limit-proxy";

import get from "./get";
import list from "./list";
import remove from "./remove";
import replace from "./replace";
import { ApiEventsResponse } from "./types";

const proxiedReplace = enforceRateLimit(replace);
const handlers = {
  DELETE: remove,

  GET: async (context: ApiRequestContext) => {
    if (context.event.pathParameters && context.event.pathParameters.id) {
      return await get(context);
    }
    return await list(context);
  },

  PUT: proxiedReplace,
};

export default handleApi<ApiEventsResponse>(
  instrumentApi<ApiEventsResponse>(async (context) => {
    const method = context.event.httpMethod;
    const handler = handlers[method];

    if (!handler) {
      throw new MethodNotAllowed();
    }

    return await handler(context);
  })
);
