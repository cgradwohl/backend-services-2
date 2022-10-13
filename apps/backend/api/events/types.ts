import { ApiRequestContext } from "~/lib/lambda-response";
import {
  IApiEventsGetResponse,
  IApiEventsListResponse,
  IApiEventsPutRequest,
  IApiEventsPutResponse,
} from "~/types.public";

export type ApiEventsResponse = IApiEventsGetResponse | IApiEventsListResponse;

export type GetFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiEventsGetResponse;
}>;

export type ListFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiEventsListResponse;
}>;

export type PutRequestBody = IApiEventsPutRequest;

export type PutFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiEventsPutResponse;
}>;

export type RemoveFn = (
  context: ApiRequestContext
) => Promise<{
  status: 204;
}>;
