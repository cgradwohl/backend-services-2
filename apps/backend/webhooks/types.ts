export type WebhookEventTypes =
  | "audiences:*"
  | "audiences:created"
  | "audiences:deleted"
  | "audiences:updated"
  | "audiences:calculated"
  | "audiences:user:matched"
  | "audiences:user:unmatched"
  | "message:*"
  | "message:updated"
  | "notification:*"
  | "notification:published"
  | "notification:submitted"
  | "notification:submission_canceled"
  | "*";

export interface IWebhookPayload {
  data: Record<string, any>;
  type: Exclude<WebhookEventTypes, "*" | "message:*" | "notification:*">;
}

export interface IWebhook {
  archived: boolean;
  created: number;
  id: string;
  description?: string;
  name: string;
  tenantId: string;
  updated: string;
  url: string;
}

export interface IWebhookJson {
  description?: string;
  events: WebhookEventTypes[];
  secret?: string;
  url: string;
}

export interface IWebhookLog {
  logType: Exclude<WebhookEventTypes, "*" | "message:*" | "notification:*">;
  objectId: string;
  request: object;
  response: object;
  pk?: string;
  sk?: string;
  status: "OK" | "ERROR";
  timestamp?: string;
  webhookId: string;
}

export interface OutboundWebhookEventDetail {
  data: Record<string, string>;
  type: IWebhookLog["logType"];
  tenantId: string;
  eventName: string;
}

export interface OutboundWebhookEventBody {
  account: string;
  detail: OutboundWebhookEventDetail;
  "detail-type": string;
  id: string;
  region: string;
  resources: Array<Record<string, string>>;
  retrySchedule: number;
  source: "courier.dynamo.messagesv3" | "courier.webhooks.emit";
  time: string;
  version: string;
}
