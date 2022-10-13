export type AnalyticsActions = "analytics:View";

export type ApiKeyActions =
  | "apikey:RotateKey"
  | "apikey:ListItems"
  | "apikey:ReadItem"
  | "apikey:WriteItem";

export type AuditTrailActions = "auditTrail:ListItems";

export type AutomationLogsActions =
  | "automationLogs:ListItems"
  | "automationLogs:ReadItem"
  | "automationLogs:WriteItem";

export type AutomationTemplateActions =
  | "automationTemplate:ListItems"
  | "automationTemplate:ReadItem"
  | "automationTemplate:WriteItem";

export type BillingAction =
  | "billing:UpdatePaymentMethod"
  | "billing:UpdatePlan"
  | "billing:ViewBilling";

export type BrandAction =
  | "brand:ListItems"
  | "brand:ReadItem"
  | "brand:WriteItem";

export type CategoryAction =
  | "category:ListItems"
  | "category:ReadItem"
  | "category:WriteItem";

export type IntegrationAction =
  | "integration:ListItems"
  | "integration:ReadItem"
  | "integration:WriteItem";

export type ListAction = "list:ListItems" | "list:ReadItem" | "list:WriteItem";

export type MessageAction =
  | "message:ListItems"
  | "message:ReadEventDetails"
  | "message:ReadItem"
  | "message:RequeueItem"
  | "message:WriteItem";

export type MetricsAction = "metrics:GetMetrics";

export type PreferenceTemplateAction =
  | "preferenceTemplate:ListItems"
  | "preferenceTemplate:ReadItem"
  | "preferenceTemplate:WriteItem";

export type RecipientAction =
  | "recipient:ListItems"
  | "recipient:ReadItem"
  | "recipient:WriteItem";

export type Recipient_2022_01_28_Action =
  | "recipient_2022_01_28:ListItems"
  | "recipient_2022_01_28:ReadItem"
  | "recipient_2022_01_28:WriteItem";

export type SecurityAction = "security:WriteSettings";

export type TemplateAction =
  | "template:ListItems"
  | "template:ReadItem"
  | "template:WriteItem";

export type TenantAction =
  | "tenant:ListItems"
  | "tenant:ReadItem"
  | "tenant:WriteItem";

export type TrackingAction = "tracking:WriteSettings";

export type UserAction =
  | "user:InviteUser"
  | "user:ListItems"
  | "user:ReadItem"
  | "user:WriteItem";

export type WebhookAction =
  | "webhook:ListItems"
  | "webhook:ReadItem"
  | "webhook:WriteItem";

export type WildcardAction =
  | "*"
  | "analytics:*"
  | "apikey:*"
  | "auditTrail:*"
  | "automationLogs:*"
  | "automationTemplate:*"
  | "billing:*"
  | "brand:*"
  | "category:*"
  | "integration:*"
  | "list:*"
  | "message:*"
  | "metrics:*"
  | "preferenceTemplate:*"
  | "recipient:*"
  | "recipient_2022_01_28:*"
  | "security:*"
  | "template:*"
  | "tenant:*"
  | "tracking:*"
  | "user:*"
  | "webhook:*";

export type Action =
  | AnalyticsActions
  | ApiKeyActions
  | AuditTrailActions
  | AutomationLogsActions
  | AutomationTemplateActions
  | BillingAction
  | BrandAction
  | CategoryAction
  | IntegrationAction
  | ListAction
  | MessageAction
  | MetricsAction
  | PreferenceTemplateAction
  | RecipientAction
  | Recipient_2022_01_28_Action
  | SecurityAction
  | TemplateAction
  | TenantAction
  | TrackingAction
  | UserAction
  | WebhookAction;

export type Effect = "ALLOW" | "DENY";

export interface IPolicyStatement {
  actions: Array<Action | WildcardAction>;
  effect: Effect;
  resources: string[];
}

export interface IPolicy {
  statements: IPolicyStatement[];
  version: "2020-11-09";
}

export interface IRole {
  label?: string;
  description?: string;
  key: string;
  policies: IPolicy[];
}
