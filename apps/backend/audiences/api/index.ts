import { handleApi } from "~/lib/lambda-response";
import { getAudiences } from "./get";
import * as AudienceTypes from "./types";
import { deleteAudience, getAudience, putAudience } from "./{audience_id}";
import {
  getAudienceMember,
  getAudienceMembers,
  putAudienceMember,
} from "./{audience_id}/members";
const handlers: {
  [Resource in AudienceTypes.Resource]: Partial<{
    [Method in AudienceTypes.Method]: AudienceTypes.AudienceHandler<AudienceTypes.BaseAudienceResponse>;
  }>;
} = {
  "/audiences": {
    get: getAudiences,
  },
  "/audiences/{audience_id}": {
    delete: deleteAudience,
    get: getAudience,
    put: putAudience,
  },
  "/audiences/{audience_id}/members": {
    get: getAudienceMembers,
  },
  "/audiences/{audience_id}/members/{member_id}": {
    get: getAudienceMember,
    put: putAudienceMember,
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
