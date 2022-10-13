type CustomerData = number | string | { [key: string]: CustomerData };

export type MessageStatus =
  | "CLICKED"
  | "DELIVERED"
  | "ENQUEUED"
  | "FILTERED"
  | "OPENED"
  | "SENT"
  | "SIMULATED"
  | "UNDELIVERABLE"
  | "UNMAPPED"
  | "UNROUTABLE";

export type MessageStatusReason =
  | "BOUNCED"
  | "FAILED"
  | "FILTERED"
  | "NO_CHANNELS"
  | "NO_PROVIDERS"
  | "OPT_IN_REQUIRED"
  | "PROVIDER_ERROR"
  | "UNPUBLISHED"
  | "UNSUBSCRIBED";

export type MessageStatusReasonCode = "HARD" | "SOFT";

export interface IMessageLog {
  archived?: number;
  clicked?: number;
  delivered?: number;
  enqueued: number;
  error?: string;
  event: string;
  id: string;
  idempotencyKey?: string;
  jobId?: string;
  listId?: string;
  listMessageId?: string;
  notification?: string;
  opened?: number;
  providers: Array<{
    channel: {
      key: string;
      name?: string;
      template: string;
    };
    clicked?: number;
    delivered?: number;
    error?: string;
    provider: string;
    providerResponse?: { [key: string]: any };
    reference?: { [key: string]: string | number };
    sent?: number;
    status: MessageStatus;
  }>;
  reason?: MessageStatusReason;
  reasonCode?: MessageStatusReasonCode;
  reasonDetails?: string;
  recipient: string; // can be recipient email or ID
  recipientId: string;
  runId?: string;
  sent?: number;
  status: MessageStatus;
  tags?: string[];
  traceId?: string;
  willRetry?: boolean;
}

export type MessageHistoryType =
  | MessageStatus
  | "DELIVERING"
  | "FILTERED"
  | "MAPPED"
  | "PROFILE_LOADED"
  | "RENDERED";

export interface IMessageHistory<T extends MessageHistoryType> {
  ts: number;
  type: T;
}

export interface IEnqueuedMessageHistory extends IMessageHistory<"ENQUEUED"> {
  data: { [key: string]: string };
  event: string;
  profile: { [key: string]: CustomerData };
  override?: { [key: string]: CustomerData };
  recipient: string;
}

export interface IMappedMessageHistory extends IMessageHistory<"MAPPED"> {
  event_id: string;
  notification_id: string;
}

export interface IProfileLoadedMessageHistory
  extends IMessageHistory<"PROFILE_LOADED"> {
  merged_profile: { [key: string]: CustomerData };
  received_profile: { [key: string]: CustomerData };
  stored_profile: { [key: string]: CustomerData };
}

export interface IRenderedMessageHistory
  extends IRoutedMessageHistory<"RENDERED"> {
  output: {
    [key: string]: string;
  };
}

export interface IUnroutableMessageHistory
  extends IMessageHistory<"UNROUTABLE"> {
  reason: MessageStatusReason;
}

export interface IUndeliverableMessageHistory
  extends IMessageHistory<"UNDELIVERABLE">,
    Partial<Omit<IRoutedMessageHistory<"UNDELIVERABLE">, "ts" | "type">> {
  reason: MessageStatusReason;
  reasonCode?: MessageStatusReasonCode;
}

// Only a subset of types are routed types
export type RoutedMessageHistoryTypes = Extract<
  MessageHistoryType,
  | "CLICKED"
  | "DELIVERED"
  | "DELIVERING"
  | "OPENED"
  | "RENDERED"
  | "SENT"
  | "UNDELIVERABLE"
>;

export interface IRoutedMessageHistory<T extends RoutedMessageHistoryTypes>
  extends IMessageHistory<T> {
  channel: { id: string; label?: string };
  integration: { id: string; provider: string };
}

export interface IDeliveredMessageHistory
  extends IRoutedMessageHistory<"DELIVERED"> {
  reference: { [key: string]: string };
}

export interface IProviderErrorMessageHistory
  extends IRoutedMessageHistory<"UNDELIVERABLE"> {
  error_message: string;
}

export interface IMessageLogList {
  paging: {
    cursor?: string;
    more: boolean;
  };
  results: IMessageLog[];
}
