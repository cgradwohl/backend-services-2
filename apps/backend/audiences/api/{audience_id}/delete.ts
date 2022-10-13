import * as AudienceTypes from "~/audiences/api/types";
import { AudienceService } from "~/audiences/services";
import { assertPathParam } from "~/lib/lambda-response";

export const deleteAudience: AudienceTypes.AudienceHandler<AudienceTypes.AudienceDeleteResponse> =
  async (context) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");
    const audienceService = new AudienceService(workspaceId);
    await audienceService.deleteAudience(audienceId);
    return {
      status: 204,
    };
  };
