import { toApiKey } from "~/lib/api-key-uuid";
import { IBrand } from "~/lib/brands/types";
import { IApiBrandItem } from "~/types.public";
import {
  transformRequest as transformSettingsRequest,
  transformResponse as transformSettingsResponse,
} from "./settings";

interface IRequest {
  id?: IBrand["id"];
  name: IBrand["name"];
  settings: IBrand["settings"];
  snippets?: IBrand["snippets"];
}
export const transformRequest = (request: IRequest) => {
  return {
    id: request.id ? request.id : undefined,
    name: request.name,
    settings: transformSettingsRequest(request.settings),
    snippets: request.snippets,
  };
};

type TransformResponseFn = (response: IBrand) => IApiBrandItem;
export const transformResponse: TransformResponseFn = (response) => {
  if (!response) {
    return null;
  }

  return {
    created: response.created,
    id: toApiKey(response.id),
    name: response.name,
    published: response.published,
    settings: transformSettingsResponse(response.settings),
    snippets: response.snippets,
    updated: response.updated,
    version: response.version,
  };
};
