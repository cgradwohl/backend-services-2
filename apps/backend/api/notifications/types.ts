import { ApiRequestContext } from "~/lib/lambda-response";
import {
  IApiNotificationGetResponse,
  IApiNotificationGetSubmissionChecksResponse,
  IApiNotificationListResponse,
  IApiNotificationPutSubmissionChecksResponse,
} from "~/types.public";

export type ApiNotificationResponse =
  | IApiNotificationGetResponse
  | IApiNotificationListResponse
  | IApiNotificationGetSubmissionChecksResponse
  | IApiNotificationPutSubmissionChecksResponse;

export type GetFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiNotificationGetResponse;
}>;

export type PostFn = (
  context: ApiRequestContext
) => Promise<{
  status: number;
}>;

export type PutFn = (
  context: ApiRequestContext
) => Promise<{
  status: number;
}>;

export type ListFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiNotificationListResponse;
}>;

export type GetSubmissionChecksFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiNotificationGetSubmissionChecksResponse;
}>;

export type PutSubmissionChecksFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiNotificationPutSubmissionChecksResponse;
}>;

export type DeleteSubmissionChecksFn = (
  context: ApiRequestContext
) => Promise<{
  status: 204 | 409;
}>;
