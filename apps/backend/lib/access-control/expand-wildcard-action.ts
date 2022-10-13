import { Action, WildcardAction } from "./types";

const analyticsActions: Action[] = ["analytics:View"];

const apiKeyActions: Action[] = [
  "apikey:ReadItem",
  "apikey:RotateKey",
  "apikey:WriteItem",
  "apikey:ListItems",
];

const auditTrailActions: Action[] = ["auditTrail:ListItems"];

const automationLogsActions: Action[] = [
  "automationLogs:ListItems",
  "automationLogs:ReadItem",
  "automationLogs:WriteItem",
];

const automationTemplateActions: Action[] = [
  "automationTemplate:ListItems",
  "automationTemplate:ReadItem",
  "automationTemplate:WriteItem",
];

const billingActions: Action[] = [
  "billing:UpdatePaymentMethod",
  "billing:UpdatePlan",
  "billing:ViewBilling",
];

const brandActions: Action[] = [
  "brand:ListItems",
  "brand:ReadItem",
  "brand:WriteItem",
];

const categoryActions: Action[] = [
  "category:ListItems",
  "category:ReadItem",
  "category:WriteItem",
];

const integrationActions: Action[] = [
  "integration:ListItems",
  "integration:ReadItem",
  "integration:WriteItem",
];

const listActions: Action[] = [
  "list:ListItems",
  "list:ReadItem",
  "list:WriteItem",
];

const messageActions: Action[] = [
  "message:ListItems",
  "message:ReadEventDetails",
  "message:ReadItem",
  "message:RequeueItem",
  "message:WriteItem",
];

const metricsActions: Action[] = ["metrics:GetMetrics"];

const preferenceTemplateActions: Action[] = [
  "preferenceTemplate:ListItems",
  "preferenceTemplate:ReadItem",
  "preferenceTemplate:WriteItem",
];

const recipientActions: Action[] = [
  "recipient:ListItems",
  "recipient:ReadItem",
  "recipient:WriteItem",
];

const securityActions: Action[] = ["security:WriteSettings"];
const trackingActions: Action[] = ["tracking:WriteSettings"];

const templateActions: Action[] = [
  "template:ListItems",
  "template:ReadItem",
  "template:WriteItem",
];

const tenantActions: Action[] = [
  "tenant:ListItems",
  "tenant:ReadItem",
  "tenant:WriteItem",
];

const userActions: Action[] = [
  "user:InviteUser",
  "user:ListItems",
  "user:ReadItem",
  "user:WriteItem",
];

const webhookActions: Action[] = [
  "webhook:ListItems",
  "webhook:ReadItem",
  "webhook:WriteItem",
];

const expandWildcardAction = (action: WildcardAction): Action[] => {
  switch (action) {
    case "analytics:*":
      return analyticsActions;

    case "apikey:*":
      return apiKeyActions;

    case "auditTrail:*":
      return auditTrailActions;

    case "automationLogs:*":
      return automationLogsActions;

    case "automationTemplate:*":
      return automationTemplateActions;

    case "billing:*":
      return billingActions;

    case "brand:*":
      return brandActions;

    case "category:*":
      return categoryActions;

    case "integration:*":
      return integrationActions;

    case "list:*":
      return listActions;

    case "message:*":
      return messageActions;

    case "metrics:*":
      return metricsActions;

    case "preferenceTemplate:*":
      return preferenceTemplateActions;

    case "recipient:*":
      return recipientActions;

    case "security:*":
      return securityActions;

    case "template:*":
      return templateActions;

    case "tenant:*":
      return templateActions;

    case "tracking:*":
      return trackingActions;

    case "user:*":
      return userActions;

    case "webhook:*":
      return webhookActions;

    case "*":
      return [
        ...analyticsActions,
        ...apiKeyActions,
        ...auditTrailActions,
        ...automationLogsActions,
        ...automationTemplateActions,
        ...billingActions,
        ...brandActions,
        ...categoryActions,
        ...integrationActions,
        ...listActions,
        ...messageActions,
        ...metricsActions,
        ...preferenceTemplateActions,
        ...recipientActions,
        ...securityActions,
        ...templateActions,
        ...tenantActions,
        ...trackingActions,
        ...userActions,
        ...webhookActions,
      ];

    default:
      return [];
  }
};

export default expandWildcardAction;
