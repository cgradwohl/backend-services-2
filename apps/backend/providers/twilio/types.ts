type Direction = "outbound-api" | "outbound-call" | "outbound-reply";

// From https://www.twilio.com/docs/sms/api/message-resource#appendix
// Excludes inbound and WhatsApp statuses
type Status =
  | "accepted"
  | "delivered"
  | "failed"
  | "queued"
  | "sending"
  | "sent"
  | "undelivered";

// Partial of https://www.twilio.com/docs/sms/api/message-resource#message-properties
export interface IMessage {
  date_updated: string;
  direction: Direction;
  error_code: number;
  error_message: string;
  sid: string;
  status: Status;
}
