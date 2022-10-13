import { toUuid } from "~/lib/api-key-uuid";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { getPatchedDocument } from "~/lib/json-patch";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { mapPreferences } from "~/lib/preferences";
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

  return {
    status: "SUCCESS",
  };
};
