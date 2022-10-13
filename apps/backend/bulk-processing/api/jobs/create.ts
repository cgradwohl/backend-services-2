import { validateMessage } from "~/bulk-processing/lib/validate";
import bulk from "~/bulk-processing/services/bulk-processing";
import { InboundBulkMessage, PostBulkJob } from "~/bulk-processing/types";
import { BadRequest } from "~/lib/http-errors";
import { ApiRequestContext, assertBody } from "~/lib/lambda-response";

const create: PostBulkJob = async (context: ApiRequestContext) => {
  const { tenantId, dryRunKey, scope, apiVersion } = context;

  const body = assertBody<{ message: InboundBulkMessage }>(context);
  const { message } = body;

  // We only support message for now
  if (!message) {
    throw new BadRequest("The 'message' parameter is required.");
  }

  await validateMessage(message, context);

  const jobId = await bulk(tenantId).createJob(message, {
    apiVersion,
    dryRunKey,
    scope,
  });

  return {
    body: {
      jobId,
    },
    status: 201,
  };
};

export default create;
