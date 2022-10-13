import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { getPatchedDocument } from "~/lib/json-patch";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { ApiProfilesPatchRequest } from "~/types.public";
import { IPatchFn } from "./types";

export const patch: IPatchFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const body = assertBody<ApiProfilesPatchRequest>(context);
  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw new BadRequest("patch property is required");
  }

  if (keys.some((key) => key !== "patch")) {
    throw new BadRequest("body contains extra keys");
  }

  const profile = await getProfile(context.tenantId, profileId);
  const json =
    typeof profile?.json === "string"
      ? JSON.parse(profile.json)
      : profile?.json ?? {};

  const patchedProfile = getPatchedDocument(json, body.patch);

  if (patchedProfile) {
    await updateProfile(context.tenantId, profileId, {
      json: patchedProfile,
    });
  }

  return {
    status: "SUCCESS",
  };
};
