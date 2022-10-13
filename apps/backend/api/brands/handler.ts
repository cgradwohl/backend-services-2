import { MethodNotAllowed } from "~/lib/http-errors";
import { ApiRequestContext, handleIdempotentApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";

import create from "./create";
import get from "./get";
import list from "./list";
import remove from "./remove";
import replace from "./replace";
import { ApiBrandsResponse } from "./types";

const handlers = {
  DELETE: remove,

  GET: async (context: ApiRequestContext) => {
    if (context.event.pathParameters && context.event.pathParameters.id) {
      return await get(context);
    }
    return await list(context);
  },

  POST: create,

  PUT: replace,
};

export default handleIdempotentApi<ApiBrandsResponse>(
  instrumentApi<ApiBrandsResponse>(async (context) => {
    const method = context.event.httpMethod;
    const handler = handlers[method];

    if (!handler) {
      throw new MethodNotAllowed();
    }

    return await handler(context);
  })
);
