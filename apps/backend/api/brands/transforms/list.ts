import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { IApiBrandItem, IApiBrandsListResponse } from "~/types.public";
import { transformResponse as transformCursorResponse } from "~/api/transforms/cursor";
import { transformResponse as transformItemResponse } from "./item";

type TransformResponseFn = (response: {
  items: IApiBrandItem[];
  lastEvaluatedKey?: DocumentClient.Key;
}) => IApiBrandsListResponse;

export const transformResponse: TransformResponseFn = (response) => {
  const cursor = transformCursorResponse(response.lastEvaluatedKey);
  const results = response.items.map(transformItemResponse);

  return {
    paging: {
      cursor,
      more: Boolean(cursor),
    },
    results,
  };
};
