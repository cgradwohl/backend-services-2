import {
  BulkJobApiVersionMismatchError,
  BulkJobDuplicateInvocationError,
  BulkJobScopeMismatchError,
} from "~/bulk-processing/lib/errors";
import bulk from "~/bulk-processing/services/bulk-processing";
import { PostBulkJobRun } from "~/bulk-processing/types";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";

const run: PostBulkJobRun = async (context) => {
  const { apiVersion, tenantId, dryRunKey, scope } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const jobId = assertPathParam(context, "jobId");

  try {
    const success = await bulk(tenantId).run(jobId, {
      apiVersion,
      dryRunKey,
      scope,
    });
    if (!success) {
      throw new NotFound();
    }
  } catch (err) {
    if (
      err instanceof BulkJobDuplicateInvocationError ||
      err instanceof BulkJobApiVersionMismatchError ||
      err instanceof BulkJobScopeMismatchError
    ) {
      throw new BadRequest(err.name, { type: "invalid_request_error" });
    }
    throw err;
  }

  return {
    status: 202,
  };
};

export default run;
