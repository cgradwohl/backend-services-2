import { transformRequest as transformCursorRequest } from "~/api/transforms/cursor";
import { getListsForProfile } from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertPathParam, getQueryParam } from "~/lib/lambda-response";
import { transformResponse } from "../../lists/transforms/list";

import { IGetListsFn } from "../types";

export const getProfileLists: IGetListsFn = async (context) => {
  const profileId = assertPathParam(context, "id");
  const cursor = getQueryParam(context, "cursor");
  try {
    const exclusiveStartKey = transformCursorRequest(cursor);
    const response = await getListsForProfile(
      context.tenantId,
      profileId,
      exclusiveStartKey
    );

    const { paging, items } = transformResponse(response);

    // hack as the new lists service is named / typed to "items" instead of the
    // previously expects "results" array
    return { paging, results: items };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new BadRequest(err.message);
    }

    throw err;
  }
};
