import { handleAudience } from "~/audiences/api/middleware/handle-audience";
import * as AudienceTypes from "~/audiences/api/types";
import { AudienceService } from "~/audiences/services";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";

export const getAudienceMember =
  handleAudience<AudienceTypes.AudienceMemberGetResponse>(async (context) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");
    const audienceService = new AudienceService(workspaceId);
    const audienceMemberId = assertPathParam(context, "member_id");
    const audience = context.audience;

    const audienceMember = await audienceService.getAudienceMember(
      audienceId,
      audience.version,
      audienceMemberId
    );

    if (!audienceMember) {
      throw new NotFound(
        `audience member ${audienceMemberId} not found, in audience ${audienceId}`
      );
    }

    return {
      status: 200,
      body: {
        added_at: audienceMember.addedAt,
        audience_id: audienceMember.audienceId,
        audience_version: audienceMember.audienceVersion,
        member_id: audienceMember.userId,
        reason: audienceMember.reason,
      },
    };
  });
