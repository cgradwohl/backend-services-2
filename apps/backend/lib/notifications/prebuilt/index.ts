import { toUuid } from "~/lib/api-key-uuid";
import * as notificationService from "~/lib/notification-service";

const prebuiltTemplateMap = {
  dev: {
    tenantId: process.env.PREBUILT_TEMPLATE_TENANT_ID,
    welcomeTemplateId: process.env.WELCOME_TEMPLATE_ID,
  },
  staging: {
    tenantId: "afbeeb4b-2021-4380-9dd5-eb4cc37106c0",
    welcomeTemplateId: "PCPWZEPQ69M2ANKZECBYJZ7ARH1N",
  },
  production: {
    tenantId: "9684145f-fcd7-418d-99af-d61f03449594",
    welcomeTemplateId: "ZETNP57DQMMT90GGH2FKJ3PXNFWZ",
  },
};

const envPrebuiltTemplateMap = prebuiltTemplateMap[process.env.STAGE];

export const getWelcomePrebuiltTemplate = async () => {
  const { tenantId, welcomeTemplateId } = envPrebuiltTemplateMap;
  if (!tenantId || !welcomeTemplateId) {
    return;
  }

  const notification = await notificationService.get({
    id: toUuid(welcomeTemplateId),
    tenantId,
  });

  return notification;
};
