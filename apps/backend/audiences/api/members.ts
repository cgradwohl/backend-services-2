import { handleApi } from "~/lib/lambda-response";
import * as AudienceTypes from "./types";
import { getAudiencesByMemberId } from "~/audiences/api/{user_id}/get";

const handlers: {
  [Resource in AudienceTypes.MemberResource]: Partial<{
    [Method in AudienceTypes.UserMethod]: AudienceTypes.AudienceHandler<AudienceTypes.BaseAudienceResponse>;
  }>;
} = {
  "/members/{member_id}/audiences": {
    get: getAudiencesByMemberId,
  },
};

export const handler = handleApi<AudienceTypes.BaseAudienceResponse>(
  async (context) => {
    const method =
      context.event.httpMethod.toLowerCase() as AudienceTypes.Method;
    const resource = context.event.resource as AudienceTypes.Resource;
    const apiHandler = handlers[resource]?.[method];
    const response = await apiHandler?.(context);
    return {
      ...response,
    };
  }
);
