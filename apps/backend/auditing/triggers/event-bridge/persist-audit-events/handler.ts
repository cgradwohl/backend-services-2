import { EventBridgeHandler } from "aws-lambda";
import {
  UnexpectedEventSourceError,
  UnexpectedEventTypeError,
} from "~/auditing/lib/errors";
import { persistAuditEvent } from "~/auditing/services/persist";

import {
  AuditEvent,
  AuditEventDetailType,
  AuditEventSources,
  AuditEventTypes,
  IBaseAuditEvent,
} from "~/auditing/types";
import { CourierLogger } from "~/lib/logger";

type Worker = EventBridgeHandler<AuditEventDetailType, IBaseAuditEvent, void>;

const { logger } = new CourierLogger("persist-audit-event");

function assertAuditEvent(event: IBaseAuditEvent): asserts event is AuditEvent {
  if (
    ![
      AuditEventTypes.API_KEY_CREATED,
      AuditEventTypes.API_KEY_DELETED,
      AuditEventTypes.API_KEY_ROTATED,
      AuditEventTypes.USER_INVITED,
      AuditEventTypes.USER_LOGOUT,
      AuditEventTypes.USER_DELETED,
      AuditEventTypes.USER_ROLE_CHANGED,
      AuditEventTypes.WORKSPACE_CTT_DISABLED,
      AuditEventTypes.WORKSPACE_CTT_ENABLED,
      AuditEventTypes.WORKSPACE_NAME_CHANGED,
      AuditEventTypes.NOTIFICATION_PUBLISHED,
      AuditEventTypes.BRAND_PUBLISHED,
      AuditEventTypes.AUTOMATION_TEMPLATE_PUBLISHED,
      AuditEventTypes.WORKSPACE_DISCOVERABILITY_ENABLED,
      AuditEventTypes.WORKSPACE_DISCOVERABILITY_DISABLED,
      AuditEventTypes.WORKSPACE_ACCESSIBILITY_CHANGED,
      AuditEventTypes.WORKSPACE_SECURITY_SSO_ENABLED,
      AuditEventTypes.WORKSPACE_SECURITY_SSO_DISABLED,
    ].includes(event.type)
  ) {
    throw new UnexpectedEventTypeError(event.type);
  }
}

function assertAuditEventSource(source: string) {
  if (!Object.values<string>(AuditEventSources).includes(source)) {
    throw new UnexpectedEventSourceError(source);
  }
}

const worker: Worker = async (record) => {
  assertAuditEvent(record.detail);
  assertAuditEventSource(record.source);
  logger.info(record);

  const event: AuditEvent = {
    ...record.detail,
    source: record.source as AuditEventSources,
  };

  await persistAuditEvent(event);
};

export default worker;
