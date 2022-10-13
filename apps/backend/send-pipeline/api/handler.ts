import { MethodNotAllowed, NotFound } from "~/lib/http-errors";
import { handleApi } from "~/lib/lambda-response";
import * as pipeline from "./pipeline";

export default handleApi<any>(async (context) => {
  const method = context.event.httpMethod;

  switch (method) {
    case "POST":
      if (context.event.resource === "/send/{id}/routing") {
        return pipeline.getRoutableSummary(context);
      }
      throw new NotFound();

    default:
      throw new MethodNotAllowed();
  }
});
