import rfdc from "rfdc";

import { list as listConfigurations } from "~/lib/configurations-service";
import { IChannel, INotificationWire } from "~/types.api";

import visit, { ApplyFn } from "./visit";

const sanitize = async (notification: INotificationWire, tenantId: string) => {
  const newNotification = rfdc()(notification);
  const { objects: archivedConfigurations } = await listConfigurations({
    archived: true,
    tenantId,
  });

  visit(
    newNotification,
    { channels: sanitizeConfigurations },
    { archivedConfigurations, tenantId }
  );

  return newNotification;
};

const sanitizeConfigurations: ApplyFn<IChannel[]> = (
  channels,
  { archivedConfigurations }
) => {
  for (const { id } of archivedConfigurations) {
    removeConfiguration(channels, id);
  }
};

const removeConfiguration = (channels: IChannel[], configurationId: string) => {
  for (const { providers } of channels) {
    const index = providers.findIndex(
      p => p.configurationId === configurationId
    );

    if (index >= 0) {
      providers.splice(index, 1);
    }
  }
};

export default sanitize;
