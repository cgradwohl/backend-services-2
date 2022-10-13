import { BadRequest, Conflict } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { put as putListItem } from "~/lib/lists";
import validate from "~/lib/lists/validate";

import {
  ListItemArchivedError,
  MalformedListIdError,
} from "~/lib/lists/errors";
import {
  IApiPutListItemRequest,
  IApiPutListItemResponse,
} from "~/types.public";
import { HttpEventHandler } from "../../types";

type Body = IApiPutListItemRequest["body"];

const handler: HttpEventHandler<IApiPutListItemResponse> = async (context) => {
  const id = assertPathParam(context, "id");
  const { tenantId, userId } = context;
  const listItem = assertBody<Body>(context, { validateFn: validate });

  try {
    await putListItem(tenantId, userId, {
      ...listItem,
      id,
    });

    return {
      status: 204,
    };
  } catch (err) {
    if (err instanceof MalformedListIdError) {
      throw new BadRequest(err.message);
    }

    if (err instanceof ListItemArchivedError) {
      throw new Conflict("List has been archived");
    }

    throw err;
  }
};

export default handler;
