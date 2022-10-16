import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import getIdempotencyKeyHeader from "~/lib/idempotent-requests/get-header";
import {
  ApiRequestContext,
  assertBody,
  getRequestHeader,
} from "~/lib/lambda-response";
import { actionService, requestService } from "~/send/service";
import { IRequestAction } from "~/send/types";
import { RequestV2 } from "./types";
import { validateV2Request } from "./validation/validate-v2-request";

type IRequestV2Handler = (payload: {
  context: ApiRequestContext;
  traceId: string;
}) => Promise<void>;

export const handleV2Request: IRequestV2Handler = async ({
  context,
  traceId: requestId,
}) => {
  const request = assertBody<RequestV2>(context);
  const idempotencyKey = getIdempotencyKeyHeader(context);
  const source = getRequestHeader(context, "X-COURIER-SOURCE");
  const { scope, tenantId, dryRunKey } = context;

  await validateV2Request(request, tenantId);

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const { filePath } = await requestService(tenantId).create({
    apiVersion: "2021-11-01",
    dryRunKey,
    idempotencyKey,
    request,
    requestId,
    scope,
    source,
  });

  await actionService(tenantId).emit<IRequestAction>({
    command: "request",
    apiVersion: "2021-11-01",
    dryRunKey,
    requestFilePath: filePath,
    requestId,
    scope,
    source,
    tenantId,
  });
};
