import { IBrand } from "~/lib/brands/types";
import {
  transformRequest as transformEmailSettingsRequest,
  transformResponse as transformEmailSettingsResponse,
} from "./email-settings";

type TransformFn = (settings: IBrand["settings"]) => IBrand["settings"];

export const transformRequest: TransformFn = settings => {
  if (!settings) {
    return {};
  }

  return {
    ...settings,
    email: transformEmailSettingsRequest(settings.email),
  };
};

export const transformResponse: TransformFn = settings => {
  if (!settings) {
    return {};
  }

  return {
    ...settings,
    email: transformEmailSettingsResponse(settings.email),
  };
};
