import { EmailDomainBlockedError } from "~/lib/assertions/email-domain-allowed";
import captureException from "~/lib/capture-exception";
import { sendErrorMetric } from "~/lib/courier-emf/logger-metrics-utils";
import {
  createErrorEvent,
  createUndeliverableEvent,
} from "~/lib/dynamo/event-logs";
import { EmailParseError } from "~/lib/email-parser";
import { RoutingError } from "~/lib/errors";
import { JsonnetEvalError } from "~/lib/jsonnet";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";
import logger from "~/lib/logger";
import { PricingPlan } from "~/lib/plan-pricing";
import { RouteNode, RouteTimeoutTable } from "~/lib/send-routing";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import {
  FailedPreconditionSendError,
  UnavailableSendError,
  UnknownSendError,
} from "~/send/errors";
import {
  NonRetryableSendError,
  RetryableSendError,
  SendError,
} from "~/send/errors/types";
import { ISendProviderPayload, SendActionCommands } from "~/send/types";
import { failover, FailoverOpts } from "~/send/utils/failover";
import { retryMessage } from "~/send/utils/retry-message";
import { ChannelDetails } from "~/types.internal";

export async function handleSendError({
  payload,
  error,
  provider,
  providerConfigId,
  channel,
  timeouts,
  pricingPlan,
  tree,
}: {
  payload: ISendProviderPayload;
  error: any;
  provider: string;
  providerConfigId: string;
  channel: ChannelDetails;
  timeouts?: RouteTimeoutTable;
  pricingPlan?: PricingPlan;
  tree?: RouteNode;
}): Promise<void> {
  const errorContext = {
    command: "send",
    tenantId: payload.tenantId,
    messageId: payload.messageId,
    messageFilePath: payload.messageFilePath,
    requestId: payload.requestId,
    outputFilePath: payload.outputFilePath,
  };

  logger.error({ error, errorContext });

  const { tenantId, messageId } = payload;
  const failoverOpts: FailoverOpts | undefined =
    payload.address && payload.times ? { ...payload, pricingPlan } : undefined;

  if (error instanceof EmailDomainBlockedError) {
    const emailDomainError = new FailedPreconditionSendError(
      error,
      errorContext
    );

    await createUndeliverableEvent(
      payload.tenantId,
      payload.messageId,
      "INVALID_ADDRESS",
      `${error.emailAddress} belongs to a reserved domain name`
    );
    failoverOpts && (await failover(failoverOpts));

    logger.error(emailDomainError);

    await sendErrorMetric({
      action: payload,
      error: emailDomainError,
      tenantId: payload.tenantId,
      traceId: payload.requestId,
    });

    return;
  }

  const errorMessage = getErrorMessage(error);

  let errorData, providerRequest;
  if (error instanceof ProviderResponseError) {
    errorData = error.payload;
    providerRequest = error.request;
  }

  const retryMessagePayload = {
    ...payload,
    streamName: process.env.PROVIDER_SEND_STREAM,
  };

  const isRetryableError = !isNonRetryableError(error);

  await createErrorEvent(payload.tenantId, payload.messageId, errorMessage, {
    channel,
    configuration: providerConfigId,
    provider,
    providerRequest,
    providerResponse: {
      ...(error as any).error,
      ...errorData,
    },
    willRetry: isRetryableError,
  });

  if (!isRetryableError) {
    const nonRetryableError =
      error instanceof SendError
        ? error
        : new FailedPreconditionSendError(error, errorContext);

    logger.error(nonRetryableError);

    await sendErrorMetric({
      action: payload,
      error: nonRetryableError,
      tenantId: payload.tenantId,
      traceId: payload.requestId,
    });
  }

  if (isRetryableError) {
    const retryableError =
      error instanceof RetryableProviderResponseError
        ? new UnavailableSendError(error, errorContext)
        : error instanceof SendError
        ? error
        : new UnknownSendError(error, errorContext);

    await retryMessage(
      retryMessagePayload,
      failoverOpts ? { ...failoverOpts, tree, timeouts } : undefined
    );

    logger.error(retryableError);

    await sendErrorMetric({
      action: payload,
      error: retryableError,
      tenantId: payload.tenantId,
      traceId: payload.requestId,
    });

    return;
  }

  if (!isCustomerFacingError(error)) {
    console.error(`[${tenantId}#${messageId}]`, error); //TODO: replace by logger
    await captureException(error);
  }

  failoverOpts && (await failover(failoverOpts));
}

function getErrorMessage(error: Error): string {
  if (isCustomerFacingError(error)) {
    return error.toString();
  }

  return "Internal Courier Error";
}

function isCustomerFacingError(error: Error) {
  return [
    ProviderConfigurationError,
    RoutingError,
    ProviderResponseError,
    EmailParseError,
    JsonnetEvalError,
    HandlebarsEvalError,
  ].some((e) => error instanceof e);
}

function isNonRetryableError(error: Error) {
  const unRetryableErrors = [
    ProviderConfigurationError,
    RoutingError,
    ProviderResponseError,
    EmailParseError,
    JsonnetEvalError,
    HandlebarsEvalError,
  ];

  if (error instanceof RetryableProviderResponseError) {
    return false;
  }

  if (error instanceof RetryableSendError) {
    return false;
  }

  if (error instanceof NonRetryableSendError) {
    return true;
  }

  return unRetryableErrors.some((e) => error instanceof e);
}
