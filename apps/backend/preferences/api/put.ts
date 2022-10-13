import { toUuid } from "~/lib/api-key-uuid";
import * as profiles from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { mapPreferences } from "~/lib/preferences";
import validate from "~/lib/preferences/validate";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { ApiPreferencesPutRequest } from "~/types.public";
import { IPutFn } from "./types";
import { validateNotificationPreferences } from "./utils/validate-preferences";

export const put: IPutFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const body = assertBody<ApiPreferencesPutRequest>(context);

  const valid = validate(body);

  if (!valid) {
    throw new BadRequest(
      validate.errors.map((error) => error.message).join(". ")
    );
  }

  const { notifications, categories } = mapPreferences(
    {
      categories: body?.categories,
      notifications: body?.notifications,
    },
    toUuid
  );

  const preferenceTemplateId = body?.templateId ?? null;

  try {
    const preferences = {
      categories,
      notifications,
    };
    // This exists to validate preferences of an individual notification against preference template
    if (preferenceTemplateId !== null) {
      const { templateName, templateItems } = await preferenceTemplateService(
        context.tenantId,
        profileId
      ).get("templates", toUuid(preferenceTemplateId));

      for (const notificationId of Object.keys(notifications)) {
        validateNotificationPreferences(
          notificationId,
          templateName,
          notifications[notificationId],
          templateItems
        );
      }
    }

    await profiles.update(context.tenantId, profileId, { preferences });

    return {
      status: "SUCCESS",
    };
  } catch (error) {
    throw new BadRequest(error.message ?? "Error Saving Preferences");
  }
};
