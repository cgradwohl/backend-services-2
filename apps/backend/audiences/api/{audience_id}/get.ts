import * as AudienceTypes from "~/audiences/api/types";
import { handleAudience } from "../middleware/handle-audience";

export const getAudience = handleAudience<AudienceTypes.AudienceGetResponse>(
  async (context) => {
    const audience = await context.audience;

    return {
      status: 200,
      body: {
        created_at: audience.createdAt,
        description: audience.description,
        id: audience.audienceId,
        name: audience.name,
        filter: audience.filter,
        updated_at: audience.updatedAt,
      },
    };
  }
);
