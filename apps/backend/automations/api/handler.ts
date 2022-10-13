import { MethodNotAllowed, NotFound } from "~/lib/http-errors";
import { handleApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import * as runs from "./runs";

export default handleApi<any>(
  instrumentApi<any>(async (context) => {
    const method = context.event.httpMethod;

    switch (method) {
      case "GET":
        if (context.event.resource === "/automations/runs/{id}") {
          return runs.getRun(context);
        }
        throw new NotFound();

      default:
        throw new MethodNotAllowed();
    }
  })
);
