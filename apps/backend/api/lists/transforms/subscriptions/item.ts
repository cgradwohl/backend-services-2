import { IListItemSubscription } from "~/lib/lists/types";
import { IApiListItemSubscription } from "~/types.public";

type TransformResponseFn = (
  list: IListItemSubscription
) => IApiListItemSubscription;

export const transformResponse: TransformResponseFn = (listItem) => {
  return {
    created: new Date(listItem.created).toISOString(),
    preferences: listItem.json.preferences,
    recipientId: listItem.recipientId,
  };
};
