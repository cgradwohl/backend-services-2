import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import * as notifications from "~/lib/notification-service";
import { applyLocales } from "~/lib/notification-service/apply-locales";
import { get as getLocales } from "~/lib/notification-service/locales";
import materializedObjectService from "~/objects/services/materialized-objects";
import { INotificationWire } from "~/types.api";

type GetNotification = (
  tenantId: string,
  notificationId: string
) => Promise<INotificationWire>;

const getNotification: GetNotification = async (
  tenantId: string,
  notificationId: string
) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return notifications.get({ id: notificationId, tenantId });
  }

  const materializedObjects = materializedObjectService(tenantId);
  const notification = await materializedObjects.get(notificationId);

  if (!notification || !notification.objtype) {
    return notifications.get({ id: notificationId, tenantId });
  }

  const locales = await getLocales({
    tenantId,
    id: notification.id,
  });

  return applyLocales({
    notification,
    locales,
  });
};

export default getNotification;
