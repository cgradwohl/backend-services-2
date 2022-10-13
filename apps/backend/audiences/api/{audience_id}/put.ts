import * as AudienceTypes from "~/audiences/api/types";
import { AudienceService } from "~/audiences/services";
import validateFn from "~/audiences/util/validate";
import captureException from "~/lib/capture-exception";
import { assertBody, assertPathParam } from "~/lib/lambda-response";

export const putAudience: AudienceTypes.AudienceHandler<AudienceTypes.AudiencePutResponse> =
  async (context) => {
    const workspaceId = context.tenantId;
    const audienceId = assertPathParam(context, "audience_id");

    const audience = assertBody<AudienceTypes.Audience>(context, {
      validateFn,
    });

    const audienceService = new AudienceService(workspaceId);

    try {
      const response = await audienceService.updateAudience({
        ...audience,
        id: audienceId,
      });

      return {
        status: 200,
        body: {
          audience: {
            id: response.audienceId,
            name: response.name,
            description: response.description,
            created_at: response.createdAt,
            updated_at: response.updatedAt,
            filter: response.filter,
          },
        },
      };
    } catch (error) {
      console.error(
        `[a/${workspaceId}/${audienceId}] Failed to update ${error}`
      );
      await captureException(error);
      throw error;
    }
  };
