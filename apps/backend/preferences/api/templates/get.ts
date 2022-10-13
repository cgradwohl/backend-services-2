import { toUuid } from "~/lib/api-key-uuid";
import { assertPathParam } from "~/lib/lambda-response";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { IPreferenceTemplate } from "~/preferences/types";
import { IGetPreferenceTemplateFn } from "../types";

export const getTemplate: IGetPreferenceTemplateFn = async (context) => {
  const templateId = assertPathParam(context, "id");

  const { get: getTemplateById } = preferenceTemplateService(
    context.tenantId,
    context.userId
  );

  const {
    created,
    creatorId,
    templateName,
    updated,
    updaterId,
    allowedPreferences,
    defaultStatus,
    routingOptions,
  } = await getTemplateById<IPreferenceTemplate>(
    "templates",
    toUuid(templateId)
  );

  return {
    allowedPreferences,
    created,
    creatorId,
    defaultStatus,
    templateId,
    templateName,
    updated,
    updaterId,
    routingOptions,
  };
};
