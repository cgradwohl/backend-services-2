import {
  NonRetryableSendError,
  RetryableSendError,
  SendErrorType,
} from "./types";

/**
 * Internal send processing errors.
 * This means that some expected outcome failed.
 * Reserved for serious or fatal errors.
 */
export class InternalSendError extends RetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.INTERNAL,
      detail,
    });
  }
}

/**
 * Some requested entity (e.g. S3 Object or DynamoDB Item) was not found.
 * If the error is caused during send pipeline service communication (command processing I/O)
 * then NotFoundSendError should be used.
 */
export class NotFoundSendError extends RetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.NOT_FOUND,
      detail,
    });
  }
}

/**
 * Some resource dependency has been exhausted. (e.g. DynamoDB Table was throttled)
 */
export class ResourceExhaustedSendError extends RetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.RESOURCE_EXHAUSTED,
      detail,
    });
  }
}

/**
 * Some resource dependency is currently unavailable.
 * (e.g. SQS service is down, Kinesis is unresponsive, Courier Event Log service is down.)
 */
export class UnavailableSendError extends RetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.UNAVAILABLE,
      detail,
    });
  }
}

/**
 * A private service fails without any context.
 * This should rarely be used, if at all.
 */
export class UnknownSendError extends RetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.UNKNOWN,
      detail,
    });
  }
}

/**
 * The entity that a client attempted to create already exists.
 * (e.g. the S3 Object filepath already exists.)
 */
export class AlreadyExistsSendError extends NonRetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.ALREADY_EXISTS,
      detail,
    });
  }
}

/**
 * The client specified an invalid argument.
 * Indicates arguments that are problematic regardless of the state of the system
 */
export class InvalidArgumentSendError extends NonRetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.INVALID_ARGUMENT,
      detail,
    });
  }
}

/**
 * The operation was rejected because the system is not in a state
 * required for the operation's execution.
 * If the error is caused by an external data source operation (routing, brands, template, event logs),
 * then FailedPreconditionError should be used.
 * (e.g. the Notification Template or Brand was not found in Prepare.)
 */
export class FailedPreconditionSendError extends NonRetryableSendError {
  constructor(error: unknown, detail?: Record<string, string>) {
    super({
      error,
      type: SendErrorType.FAILED_PRECONDITION,
      detail,
    });
  }
}
