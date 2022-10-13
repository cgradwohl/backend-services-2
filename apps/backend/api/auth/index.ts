import { NotFound } from "~/lib/http-errors";
import { handleApi } from "~/lib/lambda-response";
import { getHandler } from "./handlers";

export const handler = handleApi(async (context) => {
  const handler = getHandler(context);

  if (!handler) {
    throw new NotFound();
  }

  return handler(context);
});
