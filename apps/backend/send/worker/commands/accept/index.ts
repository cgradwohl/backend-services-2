import { createRequestReceivedEvent } from "~/lib/dynamo/event-logs";
import { actionService, messageService } from "~/send/service";
import {
  IAcceptAction,
  IAdHocListAction,
  ISendAudiencesAction,
  IListAction,
  IListPatternAction,
  IPrepareAction,
  SendActionCommands,
} from "~/send/types";
import { AudienceRecipient } from "~/api/send/types";
import { requests } from "~/send/service/data";
import { CourierLogger } from "~/lib/logger";
import { Logger, LoggerOptions } from "pino";
import {
  DeliveryProgressionMetric,
  translationProgressionMetric,
} from "~/lib/courier-emf/logger-metrics-utils";

const acceptForTranslationVerification = async (
  action: IAcceptAction,
  logger: Logger<LoggerOptions>
) => {
  try {
    const { requestId, tenantId } = action;
    const request = await requests(tenantId).getPayload(requestId);

    if (Array.isArray(request?.message?.to)) {
      return await actionService(tenantId).emit<IAdHocListAction>({
        command: "ad-hoc-list",
        dryRunKey: request?.dryRunKey,
        requestId,
        tenantId,
      });
    }

    if ("audience_id" in request?.message?.to) {
      return await actionService(tenantId).emit<ISendAudiencesAction>({
        command: "send-audiences",
        dryRunKey: request?.dryRunKey,
        audienceId: (request.message.to as AudienceRecipient).audience_id,
        requestId,
        tenantId,
      });
    }

    if ("list_id" in request?.message?.to) {
      return await actionService(tenantId).emit<IListAction>({
        command: "list",
        dryRunKey: request?.dryRunKey,
        requestId,
        tenantId,
      });
    }

    if ("list_pattern" in request?.message?.to) {
      return await actionService(tenantId).emit<IListPatternAction>({
        command: "list-pattern",
        dryRunKey: request?.dryRunKey,
        requestId,
        tenantId,
      });
    }

    const { message, filePath: messageFilePath } = await messageService(
      tenantId
    ).create({
      message: {
        apiVersion: request.apiVersion,
        idempotencyKey: request.idempotencyKey,
        jobId: request.jobId,
        message: request.message,
        messageId: request.requestId, // the requestId acts as the messageId for a request that only produce's one message
        requestId: request.requestId,
        sequenceId: request?.params?.sequenceId,
        sequenceActionId: request?.params?.sequenceActionId,
        nextSequenceActionId: request?.params?.nextSequenceActionId,
        source: request.source,
      },
      shouldVerifyRequestTranslation: true,
    });

    await actionService(tenantId).emit<IPrepareAction>({
      command: "prepare",
      dryRunKey: request?.dryRunKey,
      messageId: message.messageId,
      messageFilePath,
      requestId,
      tenantId,
      shouldVerifyRequestTranslation: true,
    });

    return;
  } catch (error) {
    logger.warn("ACCEPT FOR TRANSLATION VERIFICATION ERROR");
    logger.warn(error);
  }
};

export const accept = async (action: IAcceptAction) => {
  if (action?.shouldVerifyRequestTranslation === true) {
    const { logger } = new CourierLogger(
      "ACCEPT COMMAND: TRANSLATION VERIFICATION"
    );
    logger.debug("shouldVerifyRequestTranslation === true");

    await translationProgressionMetric({
      action: SendActionCommands.Accept,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
      version: "v2",
    });

    await acceptForTranslationVerification(action, logger);

    return;
  }

  const { requestId, tenantId } = action;
  const request = await requests(tenantId).getPayload(requestId);

  if (Array.isArray(request?.message?.to)) {
    return await actionService(tenantId).emit<IAdHocListAction>({
      command: "ad-hoc-list",
      dryRunKey: request?.dryRunKey,
      requestId,
      tenantId,
    });
  }

  if ("audience_id" in request?.message?.to) {
    return await actionService(tenantId).emit<ISendAudiencesAction>({
      command: "send-audiences",
      dryRunKey: request?.dryRunKey,
      audienceId: (request.message.to as AudienceRecipient).audience_id,
      requestId,
      tenantId,
    });
  }

  if ("list_id" in request?.message?.to) {
    return await actionService(tenantId).emit<IListAction>({
      command: "list",
      dryRunKey: request?.dryRunKey,
      requestId,
      tenantId,
    });
  }

  if ("list_pattern" in request?.message?.to) {
    return await actionService(tenantId).emit<IListPatternAction>({
      command: "list-pattern",
      dryRunKey: request?.dryRunKey,
      requestId,
      tenantId,
    });
  }

  const { message, filePath: messageFilePath } = await messageService(
    tenantId
  ).create({
    message: {
      apiVersion: request.apiVersion,
      idempotencyKey: request.idempotencyKey,
      jobId: request.jobId,
      message: request.message,
      messageId: request.requestId, // the requestId acts as the messageId for a request that only produce's one message
      requestId: request.requestId,
      sequenceId: request?.params?.sequenceId,
      sequenceActionId: request?.params?.sequenceActionId,
      nextSequenceActionId: request?.params?.nextSequenceActionId,
      source: request.source,
    },
    translated: request?.translated,
  });

  // NOTE: currently we do not throw on EventLog emit
  await createRequestReceivedEvent({
    tenantId,
    requestId: request.requestId,
    request,
  });

  await DeliveryProgressionMetric({
    action: SendActionCommands.Accept,
    properties: {
      traceId: action.requestId,
      tenantId: action.tenantId,
    },
  });

  return await actionService(tenantId).emit<IPrepareAction>({
    command: "prepare",
    dryRunKey: request?.dryRunKey,
    messageId: message.messageId,
    messageFilePath,
    requestId,
    tenantId,
    translated: request?.translated,
  });
};
