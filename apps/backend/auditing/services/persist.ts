import { nanoid } from "nanoid";
import {
  AuditEventStoreTypes,
  putItem,
} from "~/auditing/stores/dynamo/audit-events";
import {
  AuditEvent,
  AuditEventActor,
  AuditEventTarget,
} from "~/auditing/types";
import { createAuditEventKey } from "~/auditing/util/dynamo";

export const persistAuditEvent = async (event: AuditEvent) => {
  const auditEventId = nanoid();
  const {
    scope,
    source,
    timestamp,
    type,
    workspaceId,
    user,
    target: eventTarget,
  } = event;
  const { pk, sk } = createAuditEventKey(auditEventId, timestamp, workspaceId);

  const actor: AuditEventActor = {
    ...(user?.email && { email: user?.email }),
    ...(user?.id && { id: user?.id }),
  };

  const target: AuditEventTarget = {
    ...(eventTarget?.email && { email: eventTarget?.email }),
    ...(eventTarget?.id && { id: eventTarget?.id }),
  };

  const auditEvent: AuditEventStoreTypes.IDDBAuditEvent = {
    actor,
    auditEventId,
    pk,
    scope,
    sk,
    source,
    timestamp,
    type,
    workspaceId,
    target,
  };

  await putItem(auditEvent);
};
