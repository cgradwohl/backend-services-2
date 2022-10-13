import { assertPathParam } from "~/lib/lambda-response";
import { MemberService } from "~/audiences/services/member";

export const getAudiencesByMemberId = async (context) => {
  const memberId = assertPathParam(context, "member_id");
  const workspaceId = context.tenantId;
  const memberService = new MemberService(workspaceId);
  const audiences = await memberService.listAudiencesByMemberId(memberId);
  return {
    status: 200,
    body: {
      ...audiences,
      items: audiences.items.map((audience) => ({
        audience_id: audience.audienceId,
        audience_version: audience.audienceVersion,
      })),
    },
  };
};
