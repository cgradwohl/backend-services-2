import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { subscribe } from "~/lib/lists";
import { warn } from "~/lib/log";
import { ApiProfilesAddToListsRequest } from "~/types.public";

import { IPostListsFn } from "../types";

export const postProfileLists: IPostListsFn = async (context) => {
  const recipientId = assertPathParam(context, "id");
  const body = assertBody<ApiProfilesAddToListsRequest>(context);
  await Promise.all(
    body.lists.map(async (list) =>
      subscribe(
        context.tenantId,
        context.userId,
        list.listId,
        recipientId,
        list.preferences
      )
    )
  );

  if (body.lists.length > 25) {
    warn("User added more than 25 lists for a recipient. Shame!");
  }

  return {
    status: "SUCCESS",
  };
};
