import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { restore as restoreListItem } from "~/lib/lists";
import { ListItemNotFoundError } from "~/lib/lists/errors";
import { IApiRestoreListItemResponse } from "~/types.public";
import { HttpEventHandler } from "../../../types";

const handler: HttpEventHandler<IApiRestoreListItemResponse> = async (
  context
) => {
  try {
    const id = assertPathParam(context, "id");
    const { tenantId, userId } = context;

    await restoreListItem(tenantId, userId, id);
    return {
      status: 204,
    };
  } catch (err) {
    if (err instanceof ListItemNotFoundError) {
      throw new NotFound();
    }
    throw err;
  }
};

export default handler;
