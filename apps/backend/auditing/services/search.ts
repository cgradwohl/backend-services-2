import { search as searchAuditEvents } from "~/auditing/stores/elasticsearch/audit-events";
import { toApiKey } from "~/lib/api-key-uuid";
import { EsResponse } from "~/types.api";
import { IElasticsearchAuditEvent } from "../stores/elasticsearch/types";
import { AuditEventTypes } from "../types";

export interface IAuditEventsSearchInput {
  at?: string;
  limit?: number;
  next?: string;
  prev?: string;
  search?: {};
  start?: number;
}

export interface IAuditEventApiOutput {
  actor?: {
    id?: string;
    email?: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
  auditEventId: string;
  source: string;
  timestamp: string;
  type: string;
}

export interface IAuditEventStudioOutput {
  actorEmail?: string;
  actorId?: string;
  auditEventId: string;
  source: string;
  targetEmail?: string;
  targetId?: string;
  timestamp: string;
  type: string;
}

export interface IAuditEventsSearchResponse {
  items: IAuditEventStudioOutput[] | IAuditEventApiOutput[];
  next?: string;
  prev?: string;
}

type IAuditEventsSearchResponseStudio = (
  item: IElasticsearchAuditEvent
) => IAuditEventStudioOutput;
type IAuditEventsSearchResponseApi = (
  item: IElasticsearchAuditEvent
) => IAuditEventApiOutput;

export type IAuditEventsSearchResponseMapper =
  | IAuditEventsSearchResponseStudio
  | IAuditEventsSearchResponseApi;

const formatTargetId = (targetId: string, type: AuditEventTypes) =>
  [
    AuditEventTypes.NOTIFICATION_PUBLISHED,
    AuditEventTypes.BRAND_PUBLISHED,
  ].includes(type)
    ? toApiKey(targetId, { noDashes: true })
    : targetId;

export const esResponseMapperApi = (
  item: IElasticsearchAuditEvent
): IAuditEventApiOutput => {
  if (!item) {
    return null;
  }

  return {
    actor: {
      email: item.actorEmail,
      id: item.actorId,
    },
    auditEventId: item.auditEventId,
    source: item.source,
    target: {
      email: item.targetEmail,
      id: formatTargetId(item.targetId, item.type as AuditEventTypes),
    },
    timestamp: item.timestamp,
    type: item.type,
  };
};

export const esResponseMapperStudio = (
  item: IElasticsearchAuditEvent
): IAuditEventStudioOutput => {
  if (!item) {
    return null;
  }

  return {
    actorEmail: item.actorEmail,
    actorId: item.actorId,
    auditEventId: item.auditEventId,
    source: item.source,
    targetEmail: item.targetEmail,
    targetId: formatTargetId(item.targetId, item.type as AuditEventTypes),
    timestamp: item.timestamp,
    type: item.type,
  };
};

export const search = async (
  workspaceId: string,
  input: IAuditEventsSearchInput,
  mapper: IAuditEventsSearchResponseMapper
): Promise<IAuditEventsSearchResponse> => {
  const { at, limit = 25, next, prev, start } = input;

  const results: EsResponse<IElasticsearchAuditEvent> = await searchAuditEvents(
    {
      at,
      limit,
      next,
      prev,
      start,
      workspaceId,
    }
  );

  if (!results?.items?.length) {
    return { items: [] };
  }

  return {
    items: results.items.map(mapper),
    next: results.next,
    prev: results.prev,
  };
};
