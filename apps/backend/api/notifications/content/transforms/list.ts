import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { INotificationWire } from "~/types.api";
import { IApiNotificationListResponse } from "~/types.public";
import { transformResponse as transformCursorResponse } from "~/api/transforms/cursor";
import { toApiKey } from "~/lib/api-key-uuid";

type TransformResponseFn = (
  response: {
    objects: INotificationWire[];
    lastEvaluatedKey?: DocumentClient.Key;
  },
  options?: {
    format?: string;
  }
) => IApiNotificationListResponse;

export const transformResponse: TransformResponseFn = (response) => {
  const cursor = transformCursorResponse(response.lastEvaluatedKey);
  const results = response.objects.map((item) => ({
    id: toApiKey(item.id),
    title: item.title,
  }));

  return {
    paging: {
      cursor,
      more: Boolean(cursor),
    },
    results,
  };
};
