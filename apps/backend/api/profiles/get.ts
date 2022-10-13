import { get as getProfile } from "~/lib/dynamo/profiles";
import { assertAndDecodePathParam } from "~/lib/lambda-response";
import { IGetFn } from "./types";

export const get: IGetFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const profile = await getProfile(context.tenantId, profileId);

  const json = profile
    ? typeof profile.json === "string"
      ? JSON.parse(profile.json)
      : profile.json
    : null;

  return {
    preferences: profile?.preferences ?? {},
    profile: json ?? {},
  };
};
