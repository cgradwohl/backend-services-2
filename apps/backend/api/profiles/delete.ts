import { deleteProfile as deleteProfileFromDynamo } from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertAndDecodePathParam } from "~/lib/lambda-response";
import { IDeleteProfileFn } from "./types";

export const deleteProfile: IDeleteProfileFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const tenantId = context.tenantId;
  try {
    await deleteProfileFromDynamo(tenantId, profileId);
    return { status: "SUCCESS" };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new BadRequest(err.message);
    }

    throw err;
  }
};
