import bulk from "~/bulk-processing/services/bulk-processing";
import { GetBulkJob } from "~/bulk-processing/types";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";

const get: GetBulkJob = async (context) => {
  const { tenantId, scope } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const jobId = assertPathParam(context, "jobId");

  const response = await bulk(tenantId).getJob(jobId, scope);
  if (!response) {
    throw new NotFound();
  }
  return { body: response };
};

export default get;
