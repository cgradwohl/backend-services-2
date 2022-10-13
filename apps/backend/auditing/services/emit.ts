import { putEvents } from "~/lib/eventbridge";
import { TenantScope } from "~/types.internal";
import {
  AuditEvent,
  AuditEventSources,
  AuditEventTypes,
  IApiKeyCreatedEvent,
  IApiKeyDeletedEvent,
  IApiKeyRotatedEvent,
  IAutomationTemplatePublishedEvent,
  IBaseAuditEvent,
  IBrandPublishedEvent,
  INotificationPublishedEvent,
  IUserDeletedEvent,
  IUserInvitedEvent,
  IUserLogoutEvent,
  IUserRoleChangedEvent,
  IWorkspaceAccessibilityChangedEvent,
  IWorkspaceCttDisabledEvent,
  IWorkspaceCttEnabledEvent,
  IWorkspaceDiscoverabilityDisabledEvent,
  IWorkspaceDiscoverabilityEnabledEvent,
  IWorkspaceNameChangedEvent,
  IWorkspaceSecuritySSODisabledEvent,
  IWorkspaceSecuritySSOEnabledEvent,
} from "../types";

const AuditEventDetailType = "courier.audit.event";

export const emitAuditEvent = async <T extends IBaseAuditEvent>(event: T) => {
  const { source, ...rest } = event;

  await putEvents([
    {
      Detail: JSON.stringify(rest),
      DetailType: AuditEventDetailType,
      Source: source,
    },
  ]);
};

// begin api keys
export const emitApiKeyCreatedEvent = async (
  scope: TenantScope,
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IApiKeyCreatedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.API_KEY_CREATED,
    user,
    workspaceId,
  });
};

export const emitApiKeyDeletedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IApiKeyDeletedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.API_KEY_DELETED,
    user,
    workspaceId,
  });
};

export const emitApiKeyRotatedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IApiKeyRotatedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.API_KEY_ROTATED,
    user,
    workspaceId,
  });
};
// end api keys

// begin user events
export const emitUserInvitedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<IUserInvitedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.USER_INVITED,
    user,
    workspaceId,
  });
};

export const emitUserDeletedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<IUserDeletedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.USER_DELETED,
    user,
    workspaceId,
  });
};

export const emitUserLogoutEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IUserLogoutEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.USER_LOGOUT,
    user,
    workspaceId,
  });
};

export const emitUserRoleChangedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<IUserRoleChangedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.USER_ROLE_CHANGED,
    user,
    workspaceId,
  });
};
// end user events

// begin workspace events
export const emitClickThroughTrackingDisabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceCttDisabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_CTT_DISABLED,
    user,
    workspaceId,
  });
};

export const emitClickThroughTrackingEnabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceCttEnabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_CTT_ENABLED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceNameChangedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceNameChangedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_NAME_CHANGED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceDiscoverabilityEnabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceDiscoverabilityEnabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_DISCOVERABILITY_ENABLED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceDiscoverabilityDisabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceDiscoverabilityDisabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_DISCOVERABILITY_DISABLED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceAccessibilityChangedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceAccessibilityChangedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_ACCESSIBILITY_CHANGED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceSecuritySSOEnabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceSecuritySSOEnabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_SECURITY_SSO_ENABLED,
    user,
    workspaceId,
  });
};

export const emitWorkspaceSecuritySSODisabledEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string
) => {
  await emitAuditEvent<IWorkspaceSecuritySSODisabledEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.WORKSPACE_SECURITY_SSO_DISABLED,
    user,
    workspaceId,
  });
};
// end workspace events

// begin notification events
export const emitNotificationPublishedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<INotificationPublishedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.NOTIFICATION_PUBLISHED,
    user,
    workspaceId,
  });
};
// end notification events

// begin brand events
export const emitBrandPublishedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<IBrandPublishedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.BRAND_PUBLISHED,
    user,
    workspaceId,
  });
};
// end brand events

// begin automation events
export const emitAutomationTemplatePublishedEvent = async (
  scope: AuditEvent["scope"],
  timestamp: Date,
  user: AuditEvent["user"],
  workspaceId: string,
  target: AuditEvent["target"]
) => {
  await emitAuditEvent<IAutomationTemplatePublishedEvent>({
    scope,
    source: AuditEventSources.COURIER_STUDIO,
    target,
    timestamp: timestamp.toISOString(),
    type: AuditEventTypes.AUTOMATION_TEMPLATE_PUBLISHED,
    user,
    workspaceId,
  });
};
// end automation events
