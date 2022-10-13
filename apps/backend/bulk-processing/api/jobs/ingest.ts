import {
  BulkJobAlreadySubmittedError,
  BulkJobApiVersionMismatchError,
  BulkJobScopeMismatchError,
} from "~/bulk-processing/lib/errors";
import bulk from "~/bulk-processing/services/bulk-processing";
import {
  InboundBulkMessageUser,
  IPostBulkJobIngestResponse,
  PostBulkJobIngest,
} from "~/bulk-processing/types";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";

const ingest: PostBulkJobIngest = async (context) => {
  const { apiVersion, dryRunKey, scope, tenantId } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const jobId = assertPathParam(context, "jobId");
  const body =
    assertBody<{ metadata?: any; users: InboundBulkMessageUser[] }>(context);
  const users = body.users;

  let response: IPostBulkJobIngestResponse;
  try {
    response = await bulk(tenantId).ingest(jobId, users, {
      apiVersion,
      dryRunKey,
      scope,
    });

    if (!response) {
      throw new NotFound();
    }
  } catch (err) {
    if (
      err instanceof BulkJobScopeMismatchError ||
      err instanceof BulkJobApiVersionMismatchError ||
      err instanceof BulkJobAlreadySubmittedError
    ) {
      throw new BadRequest(err.name, { type: "invalid_request_error" });
    }
  }

  return { body: response };
};

export default ingest;
