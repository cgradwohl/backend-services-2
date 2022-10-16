import { toUuid } from "~/lib/api-key-uuid";
import * as profiles from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { mapPreferences } from "~/lib/preferences";
import validate from "~/lib/preferences/validate";
import { mapExistingUserPreferencesToV4 } from "~/preferences/lib/map-existing-user-preferences-to-v4";
import { ApiPreferencesPutRequest } from "~/types.public";
import { preferenceTemplateService } from "../services/dynamo-service";
import { IPutFn } from "./types";

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

  try {
    const preferences = {
      categories,
      notifications,
    };

    await profiles.update(context.tenantId, profileId, { preferences });

    const mappedV4Preferences = mapExistingUserPreferencesToV4(
      profileId,
      preferences
    );

    if (
      mappedV4Preferences.length > 0 &&
      process.env.migrate_preferences_to_v4
    ) {
      const { updatePreferences } = preferenceTemplateService(
        context.tenantId,
        profileId
      );
      await Promise.all(
        mappedV4Preferences.map(({ _meta, ...userPreferences }) =>
          updatePreferences(userPreferences)
        )
      );
    }

    return {
      status: "SUCCESS",
    };
  } catch (error) {
    throw new BadRequest(error.message ?? "Error Saving Preferences");
  }
};
