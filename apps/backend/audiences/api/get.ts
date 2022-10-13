import { AudienceService } from "~/audiences/services";
import { getQueryParam } from "~/lib/lambda-response";
import * as AudienceTypes from "./types";

export const getAudiences: AudienceTypes.AudienceHandler<AudienceTypes.AudienceListResponse> =
  async (context) => {
    const workspaceId = context.tenantId;

    const cursor = getQueryParam(context, "cursor");
    const audienceService = new AudienceService(workspaceId);
    const audiences = await audienceService.listAudiences(cursor);

    return {
      body: {
        items: audiences.items.map<AudienceTypes.Audience>((audience) => ({
          created_at: audience.createdAt,
          description: audience.description,
          id: audience.audienceId,
          name: audience.name,
          filter: audience.filter,
          updated_at: audience.updatedAt,
        })),
        paging: audiences.paging,
      },
    };
  };
