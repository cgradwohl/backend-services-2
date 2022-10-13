import { HttpError } from "~/lib/http-errors";
import {
  CheckDeliveryStatusError,
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import { EmailParseError } from "./email-parser";

import { PreparationError, RoutingError } from "./errors";
import logger from "./logger";
import { Errors } from "./message-service/errors";

export const isWarn = (err: Error) =>
  (err instanceof HttpError && err.statusCode < 500) ||
  err instanceof Errors.MessageNotFoundError ||
  err instanceof ProviderConfigurationError ||
  err instanceof ProviderResponseError ||
  err instanceof PreparationError ||
  err instanceof EmailParseError ||
  err instanceof RetryableProviderResponseError ||
  err instanceof RoutingError ||
  err instanceof CheckDeliveryStatusError;

const handleErrorLog = (err: Error): void => {
  if (isWarn(err)) {
    if (err instanceof HttpError && err.statusCode > 499) {
      logger.fatal(err); // We can potentially alarm on fatal errors
    }
    logger.warn(err);
  } else {
    logger.error(err);
  }
};

export default handleErrorLog;
