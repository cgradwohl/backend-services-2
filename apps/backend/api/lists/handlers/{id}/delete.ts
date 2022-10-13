import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { archive as archiveListItem } from "~/lib/lists";
import { ListItemNotFoundError } from "~/lib/lists/errors";
import { IApiDeleteListItemResponse } from "~/types.public";
import { HttpEventHandler } from "../../types";

const handler: HttpEventHandler<IApiDeleteListItemResponse> = async (
  context
) => {
  const id = assertPathParam(context, "id");
  const { tenantId, userId } = context;

  try {
    await archiveListItem(tenantId, userId, id);
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
