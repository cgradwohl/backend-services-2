import { toUuid } from "~/lib/api-key-uuid";
import * as checkService from "~/lib/check-service/index";
import { assertPathParam } from "~/lib/lambda-response";
import { ICheck } from "~/types.api";
import { GetSubmissionChecksFn } from "../types";

const get: GetSubmissionChecksFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const submissionId = assertPathParam(context, "submissionId");

  const checks = await checkService.get({
    id: `${toUuid(id)}:${submissionId}`,
    tenantId,
  });

  return {
    body: {
      checks: checks.json.map((check: ICheck) => {
        return {
          id: "custom",
          status: check.status,
          type: "custom",
          updated: check.updated,
        };
      }),
    },
  };
};

export default get;
