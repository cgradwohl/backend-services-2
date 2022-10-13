import { toApiKey } from "~/lib/api-key-uuid";
import { IListItem } from "~/lib/lists/types";
import { IApiListItem } from "~/types.public";

type TransformResponseFn = (list: IListItem) => IApiListItem;

export const transformResponse: TransformResponseFn = (listItem) => {
  return {
    created: new Date(listItem.created).toISOString(),
    id: toApiKey(listItem.id),
    name: listItem.name,
    preferences: listItem.preferences,
    updated: listItem.updated ? new Date(listItem.updated).toISOString() : null,
  };
};
