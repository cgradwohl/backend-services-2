import makeError from "make-error";
import { getErrorMessage } from "./lib";

// only status codes that indicate the service did not process the request should be retried

export enum SendErrorType {
  ALREADY_EXISTS = "ALREADY_EXISTS",
  FAILED_PRECONDITION = "FAILED_PRECONDITION",
  INTERNAL = "INTERNAL",
  INVALID_ARGUMENT = "INVALID_ARGUMENT",
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",
  UNAVAILABLE = "UNAVAILABLE",
  UNKNOWN = "UNKNOWN",
}
type RetryableSendErrorType = Extract<
  SendErrorType,
  | SendErrorType.INTERNAL
  | SendErrorType.NOT_FOUND
  | SendErrorType.RESOURCE_EXHAUSTED
  | SendErrorType.UNAVAILABLE
  | SendErrorType.UNKNOWN
>;
type NonRetryableSendErrorType = Extract<
  SendErrorType,
  | SendErrorType.ALREADY_EXISTS
  | SendErrorType.FAILED_PRECONDITION
  | SendErrorType.INVALID_ARGUMENT
>;

const BaseError = makeError("BaseError");

export abstract class SendError extends BaseError {
  abstract retryable: boolean;
  abstract type: SendErrorType;
  public detail?: Record<string, string>;

  constructor(params: {
    error: unknown;
    type: SendErrorType;
    detail?: Record<string, string>;
  }) {
    super(getErrorMessage(params.error));

    if (params?.detail) {
      this.detail = params?.detail ?? (params?.error as any).detail;
    }

    if ((params.error as SendError)?.detail) {
      this.detail = {
        ...(params?.error as SendError)?.detail,
        ...params?.detail, // the last error to throw takes precedence
      };
    }
  }
}

export class NonRetryableSendError extends SendError {
  public retryable: false;
  public type: NonRetryableSendErrorType;

  constructor(params: {
    error: unknown;
    type: NonRetryableSendErrorType;
    detail?: Record<string, string>;
  }) {
    super(params);
    this.retryable = false;
    this.type = params.type;
  }
}

export class RetryableSendError extends SendError {
  public retryable: true;
  public type: RetryableSendErrorType;

  constructor(params: {
    error: unknown;
    type: RetryableSendErrorType;
    detail?: Record<string, string>;
  }) {
    super(params);
    this.retryable = true;
    this.type = params.type;
  }
}
