import { TenantScope } from "./../types.internal.d";

export type AuditEventDetailType = "courier.audit.event";

export enum AuditEventSources {
  COURIER_STUDIO = "courier.studio",
}

export enum AuditEventTypes {
  API_KEY_CREATED = "api-key:created",
  API_KEY_DELETED = "api-key:deleted",
  API_KEY_ROTATED = "api-key:rotated",
  USER_INVITED = "user:invited",
  USER_LOGOUT = "user:logout",
  USER_DELETED = "user:deleted",
  USER_ROLE_CHANGED = "user:role-changed",
  WORKSPACE_CTT_DISABLED = "workspace:click-through-tracking:disabled",
  WORKSPACE_CTT_ENABLED = "workspace:click-through-tracking:enabled",
  WORKSPACE_NAME_CHANGED = "workspace:name-changed",
  NOTIFICATION_PUBLISHED = "notification:published",
  BRAND_PUBLISHED = "brand:published",
  AUTOMATION_TEMPLATE_PUBLISHED = "automation:template:published",
  WORKSPACE_DISCOVERABILITY_ENABLED = "workspace:discoverability:enabled",
  WORKSPACE_DISCOVERABILITY_DISABLED = "workspace:discoverability:disabled",
  WORKSPACE_ACCESSIBILITY_CHANGED = "workspace:accessibility:changed",
  WORKSPACE_SECURITY_SSO_ENABLED = "workspace:security:sso-enabled",
  WORKSPACE_SECURITY_SSO_DISABLED = "workspace:security:sso-disabled",
}

export interface IBaseAuditEvent {
  source: AuditEventSources;
  timestamp: string; // ISO-8601
  type: AuditEventTypes;
  workspaceId: string;
}

export interface ICourierStudioAuditEvent extends IBaseAuditEvent {
  source: AuditEventSources.COURIER_STUDIO;
}

export interface IApiKeyAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface IUserAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface IWorkspaceAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface INotificationAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface IBrandAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface IAutomationAuditEvent<T extends AuditEventTypes>
  extends ICourierStudioAuditEvent {
  type: T;
  scope: TenantScope;
  user: {
    email: string;
    id: string;
  };
  target?: {
    id?: string;
    email?: string;
  };
}

export interface IApiKeyCreatedEvent
  extends IApiKeyAuditEvent<AuditEventTypes.API_KEY_CREATED> {}

export interface IApiKeyDeletedEvent
  extends IApiKeyAuditEvent<AuditEventTypes.API_KEY_DELETED> {}

export interface IApiKeyRotatedEvent
  extends IApiKeyAuditEvent<AuditEventTypes.API_KEY_ROTATED> {}

export interface IUserInvitedEvent
  extends IUserAuditEvent<AuditEventTypes.USER_INVITED> {}

export interface IUserLogoutEvent
  extends IUserAuditEvent<AuditEventTypes.USER_LOGOUT> {}

export interface IUserDeletedEvent
  extends IUserAuditEvent<AuditEventTypes.USER_DELETED> {}
export interface IUserRoleChangedEvent
  extends IUserAuditEvent<AuditEventTypes.USER_ROLE_CHANGED> {}

export interface IWorkspaceCttDisabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_CTT_DISABLED> {}

export interface IWorkspaceCttEnabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_CTT_ENABLED> {}
export interface IWorkspaceNameChangedEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_NAME_CHANGED> {}

export interface INotificationPublishedEvent
  extends INotificationAuditEvent<AuditEventTypes.NOTIFICATION_PUBLISHED> {}

export interface IBrandPublishedEvent
  extends IBrandAuditEvent<AuditEventTypes.BRAND_PUBLISHED> {}

export interface IAutomationTemplatePublishedEvent
  extends IAutomationAuditEvent<AuditEventTypes.AUTOMATION_TEMPLATE_PUBLISHED> {}
export interface IWorkspaceDiscoverabilityEnabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_DISCOVERABILITY_ENABLED> {}

export interface IWorkspaceDiscoverabilityDisabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_DISCOVERABILITY_DISABLED> {}

export interface IWorkspaceAccessibilityChangedEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_ACCESSIBILITY_CHANGED> {}

export interface IWorkspaceSecuritySSOEnabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_SECURITY_SSO_ENABLED> {}

export interface IWorkspaceSecuritySSODisabledEvent
  extends IWorkspaceAuditEvent<AuditEventTypes.WORKSPACE_SECURITY_SSO_DISABLED> {}

export type ApiKeyAuditEvent =
  | IApiKeyCreatedEvent
  | IApiKeyDeletedEvent
  | IApiKeyRotatedEvent;

export type UserAuditEvent =
  | IUserInvitedEvent
  | IUserDeletedEvent
  | IUserLogoutEvent
  | IUserRoleChangedEvent;

export type WorkspaceAuditEvent =
  | IWorkspaceCttDisabledEvent
  | IWorkspaceCttEnabledEvent
  | IWorkspaceNameChangedEvent
  | IWorkspaceDiscoverabilityEnabledEvent
  | IWorkspaceDiscoverabilityDisabledEvent
  | IWorkspaceAccessibilityChangedEvent
  | IWorkspaceSecuritySSOEnabledEvent
  | IWorkspaceSecuritySSODisabledEvent;

export type NotificationAuditEvent = INotificationPublishedEvent;

export type BrandAuditEvent = IBrandPublishedEvent;

export type AutomationAuditEvent = IAutomationTemplatePublishedEvent;

export type AuditEvent =
  | ApiKeyAuditEvent
  | UserAuditEvent
  | WorkspaceAuditEvent
  | NotificationAuditEvent
  | BrandAuditEvent
  | AutomationAuditEvent;

export interface IAuditEventActor {
  email?: string;
  id?: string;
}

export type AuditEventActor = IAuditEventActor;

export interface IAuditEventTarget {
  email?: string;
  id?: string;
}

export type AuditEventTarget = IAuditEventTarget;
