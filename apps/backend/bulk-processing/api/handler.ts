import { MethodNotAllowed } from "~/lib/http-errors";
import { handleIdempotentApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import create from "./jobs/create";
import get from "./jobs/get";
import ingest from "./jobs/ingest";
import run from "./jobs/run";
import getUsers from "./users/get";

const handlers = {
  "/bulk": {
    POST: create,
  },
  "/bulk/{jobId}": {
    GET: get,
    POST: ingest,
  },
  "/bulk/{jobId}/run": {
    POST: run,
  },
  "/bulk/{jobId}/users": {
    GET: getUsers,
  },
};

export default handleIdempotentApi<any>(
  instrumentApi<any>(async (context) => {
    const method = context.event.httpMethod;
    const resource = context.event.resource;
    const handler = handlers?.[resource]?.[method];

    if (!handler) {
      throw new MethodNotAllowed();
    }

    return handler(context);
  })
);
