import { NotFound } from "~/lib/http-errors";
import { handleIdempotentApi } from "~/lib/lambda-response";
import { getHandler } from "./handlers";

export const handler = handleIdempotentApi(async (context) => {
  const handler = getHandler(context);

  if (!handler) {
    throw new NotFound();
  }

  return handler(context);
});
