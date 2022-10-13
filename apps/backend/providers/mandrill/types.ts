export type MandrillSendResponse = IMandrillSendResponse[];

interface IMandrillSendResponse {
  _id: string;
}

interface ISmtpEvents {
  diag: string;
  ts: number;
  type: string;
}

export interface IMandrillInfoResponse {
  _id: string;
  smtp_events: ISmtpEvents[];
}

export interface IMandrillErrorResponse {
  code: number;
  message: string;
  name: "GeneralError" | "Invalid_Key" | "Unknown_Message" | "ValidationError";
  status: "error";
}

export interface IMandrillBody {
  to: IMandrillRecipient[];
  from_email: string;
  from_name: string;
  html: string;
  text: string;
  subject: string;
  headers?: {
    "Reply-To"?: string;
  };
}

interface IMandrillRecipient {
  email: string;
  name?: string;
  to?: "to" | "cc" | "bcc";
}
