import extractConfigurations from "~/lib/notifications/extract-configurations";
import { INotificationWire } from "~/types.api";
import getConfigurations from "~/workers/lib/get-configurations";

const getProviders = async (notification: INotificationWire) => {
  const content = notification as INotificationWire;

  if (!content?.json) {
    return [];
  }

  const configurationIds = extractConfigurations(content);

  return getConfigurations(content.tenantId, configurationIds);
};

export default getProviders;
