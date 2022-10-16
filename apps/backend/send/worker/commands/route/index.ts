import { Logger, LoggerOptions } from "pino";
import {
  DeliveryProgressionMetric,
  translationProgressionMetric,
} from "~/lib/courier-emf/logger-metrics-utils";
import {
  createErrorEvent,
  createRoutedEvent,
  createUndeliverableEvent,
  createUnroutableEvent,
} from "~/lib/dynamo/event-logs";
import { InternalCourierError } from "~/lib/errors";
import { CourierLogger } from "~/lib/logger";
import { mapPreferences } from "~/lib/preferences";
import { getRouteNode } from "~/lib/send-routing";
import { contextService } from "~/send/service";
import { IRouteAction, SendActionCommands } from "~/send/types";
import assertIsType from "~/send/utils/assert-is-type";
import { dispatchRouteTreeToRenderService } from "./lib/dispatch-route-tree-to-render";
import { ChannelHandleFailedError } from "~/lib/send-routing";
import { getUserRoutingPreferences } from "./lib/get-user-routing-preferences";
import { routeTreeToRouteSummary } from "./lib/route-tree-to-route-summary";
import {
  FailedPreconditionSendError,
  InternalSendError,
  NotFoundSendError,
  UnknownSendError,
} from "~/send/errors";

const routeForTranslationVerification = async (
  action: IRouteAction,
  logger: Logger<LoggerOptions>
) => {
  assertIsType<IRouteAction>(action);

  const {
    contextFilePath,
    dryRunKey,
    messageId,
    messageFilePath,
    requestId,
    tenantId,
  } = action;

  try {
    const context = await contextService(tenantId).get({
      filePath: contextFilePath,
    });

    const userRoutingPreferences = getUserRoutingPreferences(context);

    if (
      userRoutingPreferences?.type === "UNSUBSCRIBED" ||
      userRoutingPreferences?.type === "OPT_IN_REQUIRED"
    ) {
      logger.warn({
        event: "Undeliverable",
        tenantId,
        messageId,
        userRoutingPreferencesType: userRoutingPreferences.type,
        userRoutingPreferencesReason: userRoutingPreferences.reason,
      });

      return;
    }

    const routingSummary = routeTreeToRouteSummary(
      getRouteNode(action.failedAddress ?? [], context.routingTree)
    );

    if (!routingSummary.length) {
      logger.warn({
        event: "Unrouteable",
        tenantId: action.tenantId,
        messageId,
        type: "MISSING_PROVIDER_SUPPORT",
        reason:
          "Courier was not able to select a valid Channel or Provider given the request. Please check the message's profile and data properties and try again.",
      });

      return;
    }

    if (routingSummary.every((summary) => !summary.selected)) {
      logger.warn({
        tenantId: action.tenantId,
        messageId,
        type: "MISSING_PROVIDER_SUPPORT",
        reason:
          "Courier was not able to select a valid Channel or Provider given the request. Please check the message's profile and data properties and try again.",
      });

      return;
    }

    await dispatchRouteTreeToRenderService({
      contextFilePath,
      dryRunKey,
      messageFilePath,
      messageId,
      requestId,
      routingTree: context.routingTree,
      tenantId,
      times: action.times,
      failedAddress: action.failedAddress,
      timeouts: context.timeouts,
    });

    return;
  } catch (error) {
    logger.warn("ROUTE FOR TRANSLATION VERIFICATION ERROR");
    logger.warn(error);
  }
};

const getContext = async (params: { filePath: string; tenantId: string }) => {
  const { filePath, tenantId } = params;
  try {
    const context = await contextService(tenantId).get({
      filePath,
    });

    if (!context) {
      throw new NotFoundSendError("Context file not found.", {
        filePath,
        tenantId,
      });
    }
    return context;
  } catch (error) {
    if (error instanceof NotFoundSendError) {
      throw error;
    }

    throw new UnknownSendError(error);
  }
};

export const route = async (action: IRouteAction) => {
  if (action?.shouldVerifyRequestTranslation === true) {
    const { logger } = new CourierLogger(
      "ROUTE COMMAND: TRANSLATION VERIFICATION"
    );
    logger.debug("shouldVerifyRequestTranslation === true");

    await translationProgressionMetric({
      action: SendActionCommands.Route,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
      version: "v2",
    });

    await routeForTranslationVerification(action, logger);

    return;
  }

  assertIsType<IRouteAction>(action);
  const {
    contextFilePath,
    dryRunKey,
    messageId,
    messageFilePath,
    requestId,
    tenantId,
    retryCount,
    translated,
  } = action;
  const context = await getContext({ tenantId, filePath: contextFilePath });

  try {
    const userRoutingPreferences = getUserRoutingPreferences(context);

    if (
      userRoutingPreferences?.type === "UNSUBSCRIBED" ||
      userRoutingPreferences?.type === "OPT_IN_REQUIRED"
    ) {
      await createUndeliverableEvent(
        tenantId,
        messageId,
        userRoutingPreferences.type,
        userRoutingPreferences.reason
      );
      return;
    }

    const routingSummary = routeTreeToRouteSummary(
      getRouteNode(action.failedAddress ?? [], context.routingTree)
    );

    if (!routingSummary.length) {
      await createUnroutableEvent(
        action.tenantId,
        messageId,
        "MISSING_PROVIDER_SUPPORT",
        "Courier was not able to select a valid Channel or Provider given the request. Please check the message's profile and data properties and try again."
      );
      return;
    }

    if (routingSummary.every((summary) => !summary.selected)) {
      await Promise.all(
        routingSummary.map(async (summary) =>
          createUnroutableEvent(
            action.tenantId,
            messageId,
            "MISSING_PROVIDER_SUPPORT",
            summary?.reason ??
              "Courier was not able to select a valid Channel or Provider given the request. Please check the message's profile and data properties and try again."
          )
        )
      );
      return;
    }

    await createRoutedEvent(tenantId, messageId, {
      channelSummary: routingSummary.map((summary) => ({
        channel: summary.channel,
        provider: summary.provider,
        selected: summary.selected,
        ...(summary?.reason && { reason: summary.reason }),
      })),
      preferences: mapPreferences(context.preferences),
    });

    await DeliveryProgressionMetric({
      action: SendActionCommands.Route,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
    });

    await dispatchRouteTreeToRenderService({
      contextFilePath,
      dryRunKey,
      messageFilePath,
      messageId,
      requestId,
      routingTree: context.routingTree,
      tenantId,
      times: action.times,
      failedAddress: action.failedAddress,
      timeouts: context.timeouts,
    });
  } catch (error) {
    // TODO: we need to create better error events during specific function calls
    // not here during the catch all
    await createErrorEvent(
      tenantId,
      messageId,
      "Encountered an error selecting message destination. Please contact Courier Customer Support",
      {
        willRetry: Boolean(error?.retryable),
      }
    );

    const errorContext = {
      contextFilePath,
      dryRunKey,
      messageId,
      messageFilePath,
      requestId,
      tenantId,
      retryCount: String(retryCount),
      translated: String(translated),
    };

    if (InternalCourierError.isInternalCourierError(error)) {
      throw new InternalSendError(error, errorContext);
    }

    if (error instanceof ChannelHandleFailedError) {
      throw new InternalSendError(error, errorContext);
    }

    throw new FailedPreconditionSendError(error, errorContext);
  }
};
