import { IBrand } from "~/lib/brands/types";
import {
  transformRequest as transformEmailFooterRequest,
  transformResponse as transformEmailFooterResponse,
} from "./email-footer";

type TransformFn = (
  email: IBrand["settings"]["email"]
) => IBrand["settings"]["email"];

export const transformRequest: TransformFn = email => {
  if (!email) {
    return {};
  }

  return {
    ...email,
    footer: transformEmailFooterRequest(email.footer),
  };
};

export const transformResponse: TransformFn = email => {
  if (!email) {
    return {};
  }

  return {
    ...email,
    footer: transformEmailFooterResponse(email.footer),
  };
};
