import * as AudienceTypes from "~/audiences/api/types";
import { AudienceService } from "~/audiences/services";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam, getQueryParam } from "~/lib/lambda-response";
import { handleAudience } from "../../middleware/handle-audience";

export const getAudienceMembers =
  handleAudience<AudienceTypes.AudienceMemberListResponse>(async (context) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");

    const cursor = getQueryParam(context, "cursor");
    const audienceService = new AudienceService(workspaceId);

    const audience = context.audience;

    const response = await audienceService.listAudienceMembers(
      audienceId,
      audience.version,
      cursor
    );

    return {
      status: 200,
      body: {
        items: response.items.map((member) => ({
          added_at: member.addedAt,
          audience_id: member.audienceId,
          audience_version: member.audienceVersion,
          member_id: member.userId,
          reason: member.reason,
        })),
        paging: response.paging,
      },
    };
  });
