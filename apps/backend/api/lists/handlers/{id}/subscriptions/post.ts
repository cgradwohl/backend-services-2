import { Conflict } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { subscribe } from "~/lib/lists";
import { ListItemArchivedError } from "~/lib/lists/errors";
import {
  IApiPutListItemSubscriptionsRequest as IApiPostListItemSubscriptionsRequest,
  IApiPutListItemSubscriptionsResponse as IApiPostListItemSubscriptionsResponse,
  IProfilePreferences,
} from "~/types.public";

import { HttpEventHandler } from "../../../types";
import { validate as validateFn } from "./put";

type Body = IApiPostListItemSubscriptionsRequest["body"];

const handler: HttpEventHandler<IApiPostListItemSubscriptionsResponse> = async (
  context
) => {
  const listId = assertPathParam(context, "id");
  const { recipients } = assertBody<Body>(context, { validateFn });
  const defaultPreference: IProfilePreferences = {
    notifications: {},
  };

  try {
    await Promise.all<void>(
      recipients.map(({ recipientId, preferences = defaultPreference }) => {
        return subscribe(
          context.tenantId,
          context.userId,
          listId,
          recipientId,
          preferences
        );
      })
    );
    return { status: 204 };
  } catch (e) {
    if (e instanceof ListItemArchivedError) {
      throw new Conflict("List has been archived");
    } else {
      throw e;
    }
  }
};

export default handler;
