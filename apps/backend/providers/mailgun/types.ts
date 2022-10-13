// From: https://documentation.mailgun.com/en/latest/api-events.html#event-types
export type MailgunEvent =
  | "accepted"
  | "clicked"
  | "complained"
  | "delivered"
  | "failed"
  | "opened"
  | "rejected"
  | "stored"
  | "unsubscribed";

export interface IMailgunEventLog {
  event: MailgunEvent;
  timestamp: number;
}

export interface IMailgunRejectedEventLog extends IMailgunEventLog {
  reject: {
    reason: string;
  };
}

export interface IMailgunFailedEventLog extends IMailgunEventLog {
  "delivery-status": {
    code: number | string;
    message: string;
    description: string;
  };
  reason: string;
  severity: "permanant" | "temporary";
}
