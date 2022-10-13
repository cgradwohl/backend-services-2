import { NotFound } from "~/lib/http-errors";
import { ApiRequestContext, assertPathParam } from "~/lib/lambda-response";
import automationRuns from "../lib/services/runs";

export const getRun = async (context: ApiRequestContext) => {
  const { tenantId } = context;
  const runId = assertPathParam(context, "id");
  const runs = automationRuns(tenantId);
  const run = await runs.get(runId);

  if (!run) {
    throw new NotFound();
  }

  return {
    body: {
      run,
    },
  };
};
