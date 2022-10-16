import { toUuid } from "~/lib/api-key-uuid";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { getPatchedDocument } from "~/lib/json-patch";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { mapPreferences } from "~/lib/preferences";
import { mapExistingUserPreferencesToV4 } from "~/preferences/lib/map-existing-user-preferences-to-v4";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import {
  ApiPreferencesPatchRequest,
  IProfilePreferences,
} from "~/types.public";
import { IPatchFn } from "./types";

export const patch: IPatchFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const body = assertBody<ApiPreferencesPatchRequest>(context);
  if (!body.patch) {
    throw new BadRequest("Patch is required");
  }

  if (Object.keys(body).some((key) => key !== "patch")) {
    throw new BadRequest(`Body contains extra keys`);
  }

  const profile = await getProfile(context.tenantId, profileId);

  const patchedPreferences = mapPreferences(
    getPatchedDocument(
      mapPreferences(
        profile?.preferences ?? { categories: {}, notifications: {} }
      ),
      body.patch
    ),
    toUuid
  ) as IProfilePreferences;

  if (patchedPreferences) {
    await updateProfile(context.tenantId, profileId, {
      preferences: patchedPreferences,
    });
  }

  // update user preferences in preferences service

  const mappedV4Preferences = mapExistingUserPreferencesToV4(
    profileId,
    patchedPreferences
  );

  if (mappedV4Preferences.length > 0 && process.env.migrate_preferences_to_v4) {
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
};
