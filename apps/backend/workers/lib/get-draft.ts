import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import { applyLocales } from "~/lib/notification-service/apply-locales";
import * as drafts from "~/lib/notification-service/draft";
import { get as getLocales } from "~/lib/notification-service/locales";
import materializedObjectService from "~/objects/services/materialized-objects";
import { INotificationWire } from "~/types.api";

type GetDraft = (tenantId: string, id: string) => Promise<INotificationWire>;

const getDraft: GetDraft = async (tenantId: string, id: string) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return drafts.get({ id, tenantId });
  }

  const materializedObjects = materializedObjectService(tenantId);
  const draft = await materializedObjects.get(id);

  if (!draft || !draft.objtype) {
    return drafts.get({ id, tenantId });
  }

  const locales = await getLocales({
    tenantId,
    id: draft.id,
  });

  return applyLocales({
    notification: draft,
    locales,
  });
};

export default getDraft;
