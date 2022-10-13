import {
  AuditEventActor,
  AuditEventSources,
  AuditEventTarget,
  AuditEventTypes,
} from "~/auditing/types";
import { TenantScope } from "~/types.internal";

export interface IDDBAuditEventKey {
  pk: string; // workspaceId/auditEventId
  sk: string; // timestamp
}

export interface IDDBAuditEvent extends IDDBAuditEventKey {
  actor: AuditEventActor;
  auditEventId: string;
  scope: TenantScope;
  source: AuditEventSources;
  target?: AuditEventTarget;
  timestamp: string; // ISO-8601
  type: AuditEventTypes;
  workspaceId: string;
}
