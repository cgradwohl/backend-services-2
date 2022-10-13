import bulk from "~/bulk-processing/services/bulk-processing";
import { GetBulkJobUsers } from "~/bulk-processing/types";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";

const get: GetBulkJobUsers = async (context) => {
  const { event, tenantId, scope } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const jobId = assertPathParam(context, "jobId");
  const cursor = event.queryStringParameters
    ? event.queryStringParameters.cursor
    : null;

  const response = await bulk(tenantId).getJobUsers(jobId, scope, cursor);
  if (!response) {
    throw new NotFound();
  }
  return { body: response };
};

export default get;
