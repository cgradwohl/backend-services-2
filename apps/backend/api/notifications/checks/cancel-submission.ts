import { toUuid } from "~/lib/api-key-uuid";
import * as checkService from "~/lib/check-service/index";
import { assertPathParam } from "~/lib/lambda-response";
import { DeleteSubmissionChecksFn } from "../types";

const remove: DeleteSubmissionChecksFn = async (context) => {
  const { tenantId, userId } = context;
  const id = assertPathParam(context, "id");
  const submissionId = assertPathParam(context, "submissionId");

  await checkService.cancelSubmission({
    id: toUuid(id),
    submissionId,
    tenantId,
    userId,
  });

  return { status: 204 };
};

export default remove;
