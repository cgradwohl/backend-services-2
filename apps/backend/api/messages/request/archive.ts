import {
  ApiRequestContext,
  assertPathParam,
  handleApi,
} from "~/lib/lambda-response";
import service from "~/lib/message-service";

export const handler = handleApi(async (context: ApiRequestContext) => {
  const requestId = assertPathParam(context, "requestId");
  await service.archiveByRequestId(context.tenantId, requestId);
  return {
    status: 202,
  };
});
