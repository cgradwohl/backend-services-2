import { ApiRequestContext, Response } from "~/lib/lambda-response";

import {
  IApiDeleteListItemResponse,
  IApiGetListItemResponse,
  IApiGetListItemsResponse,
  IApiGetListItemSubscriptionsResponse,
  IApiListItemSubscribeResponse,
  IApiListItemUnsubscribeResponse,
  IApiPutListItemResponse,
  IApiRestoreListItemResponse,
} from "~/types.public";

export type HttpEventHandler<T extends Response<any>> = (
  context: ApiRequestContext
) => Promise<T>;

export type ListApiResponse =
  | IApiDeleteListItemResponse
  | IApiGetListItemResponse
  | IApiGetListItemsResponse
  | IApiGetListItemSubscriptionsResponse
  | IApiListItemSubscribeResponse
  | IApiListItemUnsubscribeResponse
  | IApiPutListItemResponse
  | IApiRestoreListItemResponse;
