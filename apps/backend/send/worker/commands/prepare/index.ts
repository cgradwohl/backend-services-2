import format from "date-fns/format";
import fromUnixTime from "date-fns/fromUnixTime";
import getUnixTime from "date-fns/getUnixTime";
import { Logger, LoggerOptions } from "pino";
import captureException from "~/lib/capture-exception";
import {
  DeliveryProgressionMetric,
  translationProgressionMetric,
} from "~/lib/courier-emf/logger-metrics-utils";
import { createErrorEvent } from "~/lib/dynamo/event-logs";
import { createPreparedEvent } from "~/lib/dynamo/event-logs";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import getTenantInfo from "~/lib/get-tenant-info";
import { CourierLogger } from "~/lib/logger";
import { get as getTenant } from "~/lib/tenant-service";
import { actionService, contextService, messageService } from "~/send/service";
import { requests } from "~/send/service/data";
import { schedules } from "~/send/service/schedule";
import {
  IMessage,
  IPrepareAction,
  IRouteAction,
  ISendMessageContext,
  SendActionCommands,
} from "~/send/types";
import assertIsType from "~/send/utils/assert-is-type";
import { retryMessage } from "~/send/utils/retry-message";
import { ITenant } from "~/types.api";
import { putSequenceStream } from "../../sequence/lib/put-sequence-stream";
import { ChannelHandleFailedError } from "../route/lib";
import {
  getErrorMessage,
  NonRetryablePrepareCommandError,
  RetryablePrepareCommandError,
  sentryErrorIgnoreList,
} from "./errors";
import { prepareContext } from "./prepare-context";

interface MessageDelayProcessingParams {
  message: IMessage;
  messageFilePath: string;
  tenantId: string;
}
export const messageDelayProcessing = async ({
  message,
  messageFilePath,
  tenantId,
}: MessageDelayProcessingParams) => {
  const job = await schedules(tenantId).putJob({
    delay: message.message.delay,
    messageFilePath,
    messageId: message.messageId,
    requestId: message.requestId,
  });

  const date = format(fromUnixTime(job.expiration), "MMMM dd, yyyy");
  const time = format(fromUnixTime(job.expiration), "h:mm OOOO");
  const minutes = (job.expiration - getUnixTime(new Date())) / 60;

  await createLogEntry(tenantId, message.messageId, EntryTypes.eventDelayed, {
    delay: message.message.delay,
    details: {
      duration: `Message delivery has been delayed by ${minutes} minutes.`,
      date: `The message will be delivered on ${date} at ${time}`,
    },
  });
};

const prepareForTranslationVerification = async (
  action: IPrepareAction,
  logger: Logger<LoggerOptions>
) => {
  assertIsType<IPrepareAction>(action);
  const {
    dryRunKey,
    messageId,
    messageFilePath,
    scheduleJobId,
    requestId,
    tenantId,
  } = action;

  try {
    const request = await requests(tenantId).getPayload(requestId);
    const message = await messageService(tenantId).get({
      filePath: messageFilePath!,
    });

    // given the presence of action.scheduleJobId, we infer
    // that this message's schedule has expired.
    const delayMessageDelivery = Boolean(
      !scheduleJobId && "delay" in message.message
    );
    if (delayMessageDelivery) {
      // put ScheduleJob and bail out
      return await messageDelayProcessing({
        message,
        messageFilePath,
        tenantId,
      });
    }

    if (message?.nextSequenceActionId) {
      await putSequenceStream({
        command: "sequence",
        dryRunKey,
        sequenceId: message?.sequenceId,
        sequenceActionId: message?.nextSequenceActionId,
        requestId,
        tenantId,
      });
    }

    const { environment } = getTenantInfo(tenantId);

    // NOTE: getTenant() does not respect a test tenantId and will not return a `tenant_id/test`
    const tenantObject = await getTenant(tenantId);
    const tenant = {
      ...tenantObject,
      tenantId, // NOTE: this tenantId needs to respect the test environment
    };

    const context = await prepareContext({
      message: message as IMessage,
      tenant: tenant as ITenant,
      request,
      environment,
      shouldVerifyRequestTranslation: true,
    });

    const { filePath: contextFilePath } = await contextService(
      tenant.tenantId
    ).create({
      messageId: message!.messageId,
      context: context as ISendMessageContext,
    });

    await actionService(tenantId).emit<IRouteAction>({
      command: "route",
      dryRunKey,
      contextFilePath,
      messageId,
      messageFilePath,
      requestId,
      tenantId,
      shouldVerifyRequestTranslation: true, // TODO: remove once translation is live
    });

    return;
  } catch (error) {
    logger.warn("PREPARE FOR TRANSLATION VERIFICATION ERROR");
    logger.warn(error);
  }
};

export const prepare = async (action: IPrepareAction) => {
  if (action?.shouldVerifyRequestTranslation === true) {
    const { logger } = new CourierLogger(
      "PREPARE COMMAND: TRANSLATION VERIFICATION"
    );
    logger.debug("shouldVerifyRequestTranslation === true");

    await translationProgressionMetric({
      action: SendActionCommands.Prepare,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
      version: "v2",
    });

    await prepareForTranslationVerification(action, logger);

    return;
  }
  assertIsType<IPrepareAction>(action);
  const { logger } = new CourierLogger("prepare");
  const {
    dryRunKey,
    messageId,
    messageFilePath,
    scheduleJobId,
    requestId,
    tenantId,
    shouldUseRouteTree,
  } = action;

  try {
    const request = await requests(tenantId).getPayload(requestId);

    const message = await messageService(tenantId).get({
      filePath: messageFilePath!,
    });

    // given the presence of action.scheduleJobId, we infer
    // that this message's schedule has expired.
    const delayMessageDelivery = Boolean(
      !scheduleJobId && "delay" in message.message
    );
    if (delayMessageDelivery) {
      // put ScheduleJob and bail out
      return await messageDelayProcessing({
        message,
        messageFilePath,
        tenantId,
      });
    }

    if (message?.nextSequenceActionId) {
      await putSequenceStream({
        command: "sequence",
        dryRunKey,
        sequenceId: message?.sequenceId,
        sequenceActionId: message?.nextSequenceActionId,
        requestId,
        tenantId,
      });
    }

    const { environment } = getTenantInfo(tenantId);

    // NOTE: getTenant() does not respect a test tenantId and will not return a `tenant_id/test`
    const tenantObject = await getTenant(tenantId);
    const tenant = {
      ...tenantObject,
      tenantId, // NOTE: this tenantId needs to respect the test environment
    };

    const context = await prepareContext({
      message: message as IMessage,
      tenant: tenant as ITenant,
      request,
      environment,
    });

    if (context === false) {
      return;
    }

    const { filePath: contextFilePath } = await contextService(
      tenant.tenantId
    ).create({
      messageId: message!.messageId,
      context: context as ISendMessageContext,
    });

    await createPreparedEvent(tenant.tenantId, message!.messageId, {
      contextFilePath,
    });

    await DeliveryProgressionMetric({
      action: SendActionCommands.Prepare,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
    });

    await actionService(tenantId).emit<IRouteAction>({
      command: "route",
      dryRunKey,
      contextFilePath,
      messageId,
      messageFilePath,
      requestId,
      tenantId,
      shouldUseRouteTree,
      translated: request?.translated,
    });
  } catch (error) {
    logger.warn(`Command Failure: 'prepare'`);
    logger.warn({
      action,
      error,
    });

    const retryMessagePayload = {
      ...action,
      streamName: process.env.ACTION_STREAM!,
    };

    const retryable =
      error instanceof RetryablePrepareCommandError ||
      error instanceof ChannelHandleFailedError;

    await captureException(error as Error, {
      ignoreList: sentryErrorIgnoreList,
    });

    await createErrorEvent(tenantId, messageId, getErrorMessage(error), {
      willRetry: retryable,
    });

    if (retryable) {
      await retryMessage(retryMessagePayload);
      return;
    }

    const isNonRetryable = error instanceof NonRetryablePrepareCommandError;
    if (isNonRetryable) {
      return;
    }
  }
};
