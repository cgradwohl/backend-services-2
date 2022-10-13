// tslint:disable: max-classes-per-file
import makeError from "make-error";

export const NonRetryablePrepareCommandError = makeError("PrepareCommandError");

export class MessageNotFoundError extends NonRetryablePrepareCommandError {}
export class MessageBrandNotFoundError extends NonRetryablePrepareCommandError {}
export class NotificationNotFoundError extends NonRetryablePrepareCommandError {}
export class EnvironmentNotFoundError extends NonRetryablePrepareCommandError {}
export class TenantNotFoundError extends NonRetryablePrepareCommandError {}

// retryable
export const RetryablePrepareCommandError = makeError("PrepareCommandError");

export const getErrorMessage = (error: Error) => {
  if (userFacingPrepareErrors.has(error.name)) {
    return error.message;
  }

  return "Encountered an error preparing message.";
};

const userFacingPrepareErrors = new Set([
  "MessageBrandNotFoundError",
  "NotificationNotFoundError",
  "ChannelHandleFailedError",
]);

export const sentryErrorIgnoreList = new Set([
  "ChannelHandleFailedError",
  "NotificationNotFoundError",
]);
