import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { transformResponse as transformCursor } from "~/api/transforms/cursor";
import { IListItem } from "~/lib/lists/types";
import { IApiGetListItemsResponse, IApiListItem } from "~/types.public";
import { transformResponse as transformItem } from "./item";

type TransformResponseFn = (response: {
  items: IListItem[];
  lastEvaluatedKey?: DocumentClient.Key;
}) => IApiGetListItemsResponse["body"];

export const transformResponse: TransformResponseFn = (response) => {
  const cursor = transformCursor(response.lastEvaluatedKey);

  return {
    items: response.items.map(transformItem),
    paging: {
      cursor,
      more: Boolean(cursor),
    },
  };
};
