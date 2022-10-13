// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { error } from "~/lib/log";
import { ApiProfilesPostRequest } from "~/types.public";
import { IPostFn } from "./types";

export const handlePost = async ({ context, profileId }) => {
  const profile = await getProfile(context.tenantId, profileId);
  const body = assertBody<ApiProfilesPostRequest>(context);
  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw new BadRequest("profile property is required");
  }

  if (keys.some((key) => key !== "profile")) {
    throw new BadRequest("body contains extra keys");
  }

  // ensure json type as jsonMerger will silent fail merging otherwise
  const currentProfile = profile ? profile.json : {};
  const currentProfileJson =
    typeof currentProfile === "string"
      ? JSON.parse(currentProfile)
      : currentProfile;

  const mergedProfile = jsonMerger.mergeObjects([
    currentProfileJson,
    body.profile,
  ]);

  // Perform post if body contains properties
  if (mergedProfile && Object.keys(mergedProfile).length) {
    try {
      await updateProfile(context.tenantId, profileId, {
        json: JSON.stringify(mergedProfile),
      });
    } catch (err) {
      error(context.tenantId, profileId, mergedProfile);
      throw err;
    }
  }
};

export const post: IPostFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");

  await handlePost({ context, profileId });
  return {
    status: "SUCCESS",
  };
};
