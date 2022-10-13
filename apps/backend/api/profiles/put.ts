import { update as updateProfile } from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertAndDecodePathParam, assertBody } from "~/lib/lambda-response";
import { error } from "~/lib/log";
import { ApiProfilesPutRequest } from "~/types.public";
import { IPutFn } from "./types";

export const put: IPutFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const body = assertBody<ApiProfilesPutRequest>(context);
  const keys = Object.keys(body);

  if (keys.length === 0) {
    throw new BadRequest("profile property is required");
  }

  if (keys.some((key) => key !== "profile")) {
    throw new BadRequest("body contains extra keys");
  }

  try {
    await updateProfile(context.tenantId, profileId, {
      json: JSON.stringify(body.profile || {}),
    });
  } catch (err) {
    error(context.tenantId, profileId, body.profile);
    throw err;
  }

  return {
    status: "SUCCESS",
  };
};
