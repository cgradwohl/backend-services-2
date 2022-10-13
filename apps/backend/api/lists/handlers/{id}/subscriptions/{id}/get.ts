import { transformResponse } from "~/api/lists/transforms/subscriptions/item";
import { HttpEventHandler } from "~/api/lists/types";
import {
  assertAndDecodePathParam,
  assertPathParam,
} from "~/lib/lambda-response";
import { getSubscription } from "~/lib/lists";
import { IApiGetSubscriptionResponse } from "~/types.public";

const handler: HttpEventHandler<IApiGetSubscriptionResponse> = async (
  context
) => {
  const listId = assertPathParam(context, "id");
  const recipientId = assertAndDecodePathParam(context, "recipientId");
  const tenantId = context.tenantId;
  return {
    body: transformResponse(
      await getSubscription(tenantId, listId, recipientId)
    ),
  };
};

export default handler;
