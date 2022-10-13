import { getListsForProfile } from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { unsubscribe } from "~/lib/lists";
import { warn } from "~/lib/log";
import { IDeleteListsFn } from "../types";

export const deleteProfileLists: IDeleteListsFn = async (context) => {
  const profileId = assertPathParam(context, "id");
  let listIdsByProfile: string[];
  let lastEvaluatedKey;

  try {
    const response = await getListsForProfile(
      context.tenantId,
      profileId,
      null
    );

    listIdsByProfile = response.items.map((item) => item.id);
    lastEvaluatedKey = response.lastEvaluatedKey;

    while (lastEvaluatedKey) {
      const { items, lastEvaluatedKey: currentKey } = await getListsForProfile(
        context.tenantId,
        profileId,
        lastEvaluatedKey
      );
      lastEvaluatedKey = currentKey;
      listIdsByProfile = [...listIdsByProfile, ...items.map((item) => item.id)];
    }

    await Promise.all(
      listIdsByProfile.map((listId) =>
        unsubscribe(context.tenantId, listId, profileId)
      )
    );
    // This is for our own instrumentation
    if (listIdsByProfile.length >= 25) {
      warn(`Unsubscribing more than 25 lists at a time`);
    }

    return { status: "SUCCESS" };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new BadRequest(err.message);
    }

    throw err;
  }
};
