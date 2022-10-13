import { AudienceService, AudienceWithoutDDBKeys } from "~/audiences/services";
import { NotFound } from "~/lib/http-errors";
import { ApiRequestContext, assertPathParam } from "~/lib/lambda-response";
import { ApiErrorResponse } from "~/types.public";

export function handleAudience<T>(
  cb: (
    context: ApiRequestContext & { audience: AudienceWithoutDDBKeys }
  ) => Promise<T | ApiErrorResponse>
) {
  return async (context: ApiRequestContext) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");
    const audienceService = new AudienceService(workspaceId);
    const audience = await audienceService.getAudience(audienceId);

    if (!audience) {
      throw new NotFound(`audience ${audienceId} not found`);
    }

    return cb({
      ...context,
      audience,
    });
  };
}
