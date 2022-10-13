import { transformRequest as transformCursor } from "~/api/transforms/cursor";
import { BadRequest } from "~/lib/http-errors";
import { getQueryParam } from "~/lib/lambda-response";
import { list as getLists } from "~/lib/lists";
import {
  InvalidListSearchPatternError,
  MalformedListIdError,
} from "~/lib/lists/errors";
import { IApiGetListItemsResponse } from "~/types.public";
import { transformResponse as transformListResponse } from "../transforms/list";
import { HttpEventHandler } from "../types";

const handler: HttpEventHandler<IApiGetListItemsResponse> = async (context) => {
  const cursor = getQueryParam(context, "cursor");
  const pattern = getQueryParam(context, "pattern");

  try {
    const exclusiveStartKey = transformCursor(cursor);
    const response = await getLists(context.tenantId, {
      exclusiveStartKey,
      pattern,
    });

    return { body: transformListResponse(response) };
  } catch (err) {
    if (
      err instanceof InvalidListSearchPatternError ||
      err instanceof MalformedListIdError ||
      err instanceof SyntaxError
    ) {
      throw new BadRequest(err.message);
    }

    throw err;
  }
};

export default handler;
