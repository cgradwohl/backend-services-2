import { MethodNotAllowed } from "~/lib/http-errors";
import { handleIdempotentApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import {
  ApiProfilesAddToListsResponse,
  ApiProfilesGetListsResponse,
  ApiProfilesGetResponse,
  ApiProfilesPatchResponse,
  ApiProfilesPostResponse,
  ApiProfilesPutResponse,
} from "~/types.public";
import { deleteProfile } from "./delete";
import { get } from "./get";
import * as fromProfileLists from "./lists";
import { patch } from "./patch";
import { post } from "./post";
import { put } from "./put";
import {
  IDeleteListsFn,
  IGetFn,
  IGetListsFn,
  IPatchFn,
  IPostFn,
  IPostListsFn,
} from "./types";

type ApiProfileResponse =
  | ApiProfilesAddToListsResponse
  | ApiProfilesGetResponse
  | ApiProfilesGetListsResponse
  | ApiProfilesPatchResponse
  | ApiProfilesPostResponse
  | ApiProfilesPutResponse;

type Resource = "/profiles/{id}" | "/profiles/{id}/lists";

type Method = "delete" | "get" | "post" | "patch" | "put";

type HandlerFn =
  | IGetFn
  | IPatchFn
  | IPostFn
  | IGetListsFn
  | IPostListsFn
  | IDeleteListsFn;

type Handler = Record<Resource, Partial<Record<Method, HandlerFn>>>;

const handlers: Handler = {
  "/profiles/{id}": {
    delete: deleteProfile,
    get,
    patch,
    post,
    put,
  },
  "/profiles/{id}/lists": {
    delete: fromProfileLists.deleteProfileLists,
    get: fromProfileLists.getProfileLists,
    post: fromProfileLists.postProfileLists,
  },
};
export const handler = handleIdempotentApi<ApiProfileResponse>(
  instrumentApi<ApiProfileResponse>(async (context) => {
    const method = context.event.httpMethod as Method;
    const resource = context.event.resource as Resource;

    try {
      return {
        body: await handlers[resource]?.[method.toLowerCase()](context),
      };
    } catch (error) {
      throw new MethodNotAllowed(
        error?.message ?? `httpMethod not supported: ${method}`
      );
    }
  })
);
