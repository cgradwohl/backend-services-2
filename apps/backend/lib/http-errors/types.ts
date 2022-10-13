export type API_ERROR = "api_error";
export type AUTHENTICATION_ERROR = "authentication_error";
export type AUTHORIZATION_ERROR = "authorization_error";
export type IDEMPOTENCY_ERROR = "idempotency_error";
export type INVALID_REQUEST_ERROR = "invalid_request_error";
export type RATE_LIMIT_ERROR = "rate_limit_error";
export type VALIDATION_ERROR = "validation_error";

export type ErrorType =
  | API_ERROR
  | AUTHENTICATION_ERROR
  | AUTHORIZATION_ERROR
  | IDEMPOTENCY_ERROR
  | INVALID_REQUEST_ERROR
  | RATE_LIMIT_ERROR
  | VALIDATION_ERROR;

export interface IErrorHeaders {
  [key: string]: number | string;
}

export interface IErrorOptions {
  code?: string;
  headers?: IErrorHeaders;
  statusCode: number;
  type: ErrorType;
}
