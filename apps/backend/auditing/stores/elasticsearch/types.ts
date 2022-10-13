export interface IElasticsearchAuditEvent {
  actorEmail?: string;
  actorId?: string;
  auditEventId: string;
  source: string;
  targetEmail?: string;
  targetId?: string;
  timestamp: string;
  type: string;
  workspaceId: string;
}

export interface IAuditEventSearchParams {
  workspaceId: string;
}

export interface IAuditEventAddIndexMapping {
  [property: string]: {
    type: string;
  };
}
