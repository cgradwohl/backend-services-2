import { transformResponse as transformCursor } from "~/api/transforms/cursor";
import { toApiKey } from "~/lib/api-key-uuid";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { IPreferenceTemplate } from "~/preferences/types";
import { IGetPreferenceTemplatesFn } from "../types";

export const getTemplates: IGetPreferenceTemplatesFn = async (context) => {
  const response = await preferenceTemplateService(
    context.tenantId,
    context.userId
  ).list();

  const items = response.Items.map<
    Omit<IPreferenceTemplate, "id" | "linkedNotifications">
  >(
    ({
      allowedPreferences,
      created,
      creatorId,
      defaultStatus,
      templateId,
      templateName,
      updated,
      updaterId,
      routingOptions,
    }) => ({
      allowedPreferences,
      created,
      creatorId,
      defaultStatus,
      templateId: toApiKey(templateId),
      templateName,
      updated,
      updaterId,
      routingOptions,
    })
  );

  const cursor = transformCursor(response.LastEvaluatedKey);
  const paging = {
    cursor,
    more: Boolean(cursor),
  };

  return {
    body: {
      items,
      paging,
    },
  };
};
