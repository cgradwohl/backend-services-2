import {
  assertAndDecodePathParam,
  assertPathParam,
} from "~/lib/lambda-response";
import { unsubscribe } from "~/lib/lists";
import { IApiListItemSubscribeResponse } from "~/types.public";
import { HttpEventHandler } from "../../../../types";

const handler: HttpEventHandler<IApiListItemSubscribeResponse> = async (
  context
) => {
  const id = assertPathParam(context, "id");
  const recipientId = assertAndDecodePathParam(context, "recipientId");
  await unsubscribe(context.tenantId, id, recipientId);
  return { status: 204 };
};

export default handler;
