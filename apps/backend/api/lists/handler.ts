import { NotFound } from "~/lib/http-errors";
import { handleIdempotentApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";

import getHandler from "./handlers";
import { ListApiResponse } from "./types";

export default handleIdempotentApi<ListApiResponse>(
  instrumentApi<ListApiResponse>((context) => {
    const handler = getHandler(context);

    if (!handler) {
      throw new NotFound();
    }

    return handler(context);
  })
);
