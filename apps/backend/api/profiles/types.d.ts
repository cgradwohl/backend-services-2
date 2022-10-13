import { ApiRequestContext } from "~/lib/lambda-response";
import {
  ApiProfilesAddToListsResponse,
  ApiProfilesGetListsResponse,
  ApiProfilesGetResponse,
  ApiProfilesPatchResponse,
  ApiProfilesPostResponse,
  ApiProfilesPutResponse,
} from "~/types.public";

export type IPostListsFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesAddToListsResponse>;

export type IGetFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesGetResponse>;

export type IGetListsFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesGetListsResponse>;

export type IDeleteListsFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesPutResponse>;

export type IPatchFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesPatchResponse>;

export type IPostFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesPostResponse>;

export type IPutFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesPutResponse>;

export type IDeleteProfileFn = (
  context: ApiRequestContext
) => Promise<ApiProfilesPostResponse>;
