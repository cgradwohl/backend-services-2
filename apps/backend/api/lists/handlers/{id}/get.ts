import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { get as getListItem } from "~/lib/lists";

import { IApiGetListItemResponse } from "~/types.public";
import { transformResponse as transformItem } from "../../transforms/item";
import { HttpEventHandler } from "../../types";

const handler: HttpEventHandler<IApiGetListItemResponse> = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const listItem = await getListItem(tenantId, id);

  if (!listItem) {
    throw new NotFound();
  }

  return { body: transformItem(listItem) };
};

export default handler;
