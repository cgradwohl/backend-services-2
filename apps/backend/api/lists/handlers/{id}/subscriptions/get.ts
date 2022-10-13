import { transformRequest as transformCursor } from "~/api/transforms/cursor";
import { assertPathParam, getQueryParam } from "~/lib/lambda-response";
import { getSubscriptions } from "~/lib/lists";
import { transformResponse as transformListResponse } from "../../../transforms/subscriptions/list";

import { IApiGetListItemSubscriptionsResponse } from "~/types.public";
import { HttpEventHandler } from "../../../types";

const handler: HttpEventHandler<IApiGetListItemSubscriptionsResponse> = async (
  context
) => {
  const id = assertPathParam(context, "id");
  const cursor = getQueryParam(context, "cursor");
  const exclusiveStartKey = transformCursor(cursor);

  const response = await getSubscriptions(context.tenantId, id, {
    exclusiveStartKey,
  });

  return { body: transformListResponse(response) };
};

export default handler;
