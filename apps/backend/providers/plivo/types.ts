export interface IMessage {
  error_code: string;
  message_state:
    | "delivered"
    | "failed"
    | "queued"
    | "received"
    | "rejected"
    | "sent"
    | "undelivered";
  message_time: string;
  message_type: "mms" | "sms";
  message_uuid: string;
}

export interface IResponse {
  messageUuid: [string];
}
