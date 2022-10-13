import { ApiRequestContext } from "~/lib/lambda-response";
import {
  IApiBrandsGetResponse,
  IApiBrandsListResponse,
  IApiBrandsPostRequest,
  IApiBrandsPostResponse,
  IApiBrandsPutRequest,
  IApiBrandsPutResponse,
} from "~/types.public";

export type ApiBrandsResponse =
  | IApiBrandsGetResponse
  | IApiBrandsListResponse
  | IApiBrandsPostResponse
  | IApiBrandsPutResponse;

export type GetFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiBrandsGetResponse;
}>;

export type ListFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiBrandsListResponse;
}>;

export type PostRequestBody = IApiBrandsPostRequest;

export type PostFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiBrandsPostResponse;
}>;

export type PutRequestBody = IApiBrandsPutRequest;

export type PutFn = (
  context: ApiRequestContext
) => Promise<{
  body: IApiBrandsPutResponse;
}>;

export type RemoveFn = (
  context: ApiRequestContext
) => Promise<{
  status: 204;
}>;
