import { BadRequest, MethodNotAllowed } from "~/lib/http-errors";
import { handleApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import {
  ApiPreferencesGetResponse,
  ApiPreferencesListResponse,
  ApiPreferencesPutResponse,
  ApiPreferenceTemplateGetResponse,
  ApiPreferenceTemplatesGetResponse,
} from "~/types.public";
import { get } from "./get";
import { list } from "./list";
import { patch } from "./patch";
import { put } from "./put";
import { getTemplate } from "./templates/get";
import { getTemplates } from "./templates/get-templates";
import { assertIsTemplateValidationError } from "./utils/validate-preferences";

type ApiPreferencesResponse =
  | ApiPreferencesGetResponse
  | ApiPreferencesListResponse
  | ApiPreferencesPutResponse
  | ApiPreferenceTemplateGetResponse
  | ApiPreferenceTemplatesGetResponse;

type Resource =
  | "/preferences"
  | "/preferences/{id}"
  | "/preferences/templates"
  | "/preferences/templates/{id}";

const handlers = {
  "/preferences": {
    get: list,
  },
  "/preferences/templates": {
    get: getTemplates,
  },
  "/preferences/templates/{id}": {
    get: getTemplate,
  },
  "/preferences/{id}": {
    get,
    patch,
    put,
  },
};

export const handler = handleApi<ApiPreferencesResponse>(
  instrumentApi<ApiPreferencesResponse>(async (context) => {
    const method = context.event.httpMethod;
    const resource = context.event.resource as Resource;

    try {
      return {
        body: await handlers[resource]?.[method.toLowerCase()](context),
      };
    } catch (error) {
      if (
        assertIsTemplateValidationError(error) ||
        error instanceof BadRequest
      ) {
        throw new BadRequest(error.message, {
          type: "validation_error",
        });
      }
      throw new MethodNotAllowed(`httpMethod not supported: ${method}`);
    }
  })
);
