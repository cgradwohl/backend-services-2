import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { transformResponse as transformCursor } from "~/api/transforms/cursor";
import { IListItemSubscription } from "~/lib/lists/types";
import { IApiGetListItemSubscriptionsResponse } from "~/types.public";
import { transformResponse as transformItem } from "./item";

type TransformResponseFn = (response: {
  items: IListItemSubscription[];
  lastEvaluatedKey?: DocumentClient.Key;
}) => IApiGetListItemSubscriptionsResponse["body"];

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
