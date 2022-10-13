export interface IPostmark422Response {
  ErrorCode: 701;
  Message: string;
}

export interface IPostmarkMessageEvent {
  ReceivedAt: "string";
  Type: "Bounced" | "Delivered" | "LinkClicked" | "Opened" | "Transient";
  Details: {
    Summary?: string;
    BounceID?: string;
  };
}

export interface IPostmarkMessageDetails {
  MessageEvents: IPostmarkMessageEvent[];
  MessageID: string;
  ReceivedAt: string;
  Status: "Queued" | "Processed" | "Sent";
}

export type PostmarkResponse = IPostmark422Response | IPostmarkMessageDetails;
