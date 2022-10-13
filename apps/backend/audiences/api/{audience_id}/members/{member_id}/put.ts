import { handleAudience } from "~/audiences/api/middleware/handle-audience";
import * as AudienceTypes from "~/audiences/api/types";
import { AudienceService } from "~/audiences/services";
import { assertPathParam } from "~/lib/lambda-response";

export const putAudienceMember =
  handleAudience<AudienceTypes.AudienceMemberPutResponse>(async (context) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");
    const audienceMemberId = assertPathParam(context, "member_id");

    const audienceService = new AudienceService(workspaceId);
    const audience = context.audience;

    const reason = "Added by API";
    const response = await audienceService.putAudienceMember(
      audienceId,
      audienceMemberId,
      reason,
      audience.version
    );
    return {
      status: 200,
      body: {
        audience_member: {
          added_at: response.addedAt,
          audience_id: audienceId,
          audience_version: audience.version,
          member_id: audienceMemberId,
          reason,
        },
      },
    };
  });
