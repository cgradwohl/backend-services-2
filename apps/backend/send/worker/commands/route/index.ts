import { deepStrictEqual } from "assert";
import { Logger, LoggerOptions } from "pino";
import {
  DeliveryProgressionMetric,
  routeTreeSummaryDifferedCount,
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
import { getRouteNode, RoutingSummary } from "~/lib/send-routing";
import { contextService } from "~/send/service";
import { IRouteAction, SendActionCommands } from "~/send/types";
import assertIsType from "~/send/utils/assert-is-type";
import { handlePossibleRouteTimeout } from "~/send/utils/get-age";
import { dispatchRouteSummaryToRenderService } from "./lib";
import { dispatchRouteTreeToRenderService } from "./lib/dispatch-route-tree-to-render";
import { ChannelHandleFailedError } from "~/lib/send-routing";
import { getRoutingSummary } from "./lib/get-routing-summary";
import { getUserRoutingPreferences } from "./lib/get-user-routing-preferences";
import { isRouteTreeEnabled } from "./lib/is-route-tree-enabled";
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
    retryCount,
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

    let routingSummary = await getRoutingSummary(context);

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

    // TODO: Remove once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue
    const maxAge = context.variableData?.maxAge;
    if (retryCount && maxAge && !context.routingTree) {
      const timedout = await handlePossibleRouteTimeout({
        retryCount,
        messageId,
        maxAge,
        routingSummary: routingSummary as any,
        translateToV2: true,
        tenantId,
        logger,
      });
      if (timedout) return;
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

    await dispatchRouteSummaryToRenderService({
      contextFilePath,
      dryRunKey,
      messageFilePath,
      messageId,
      requestId,
      routingSummary,
      tenantId,
      shouldVerifyRequestTranslation: true,
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
  const { logger } = new CourierLogger("route");
  assertIsType<IRouteAction>(action);
  const {
    contextFilePath,
    dryRunKey,
    messageId,
    messageFilePath,
    requestId,
    tenantId,
    retryCount,
    shouldUseRouteTree,
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

    const routeTreeEnabled =
      isRouteTreeEnabled(context.tenant, shouldUseRouteTree) &&
      !!context.routingTree;

    const routeSummaryNew = routeTreeToRouteSummary(
      getRouteNode(action.failedAddress ?? [], context.routingTree)
    );

    const routingSummary = routeTreeEnabled
      ? routeSummaryNew
      : await getRoutingSummary(context);

    if (!action.failedAddress && !routeTreeEnabled && context.routingTree) {
      try {
        deepStrictEqual(
          routeSummaryNew.map(selectImportantSummaryFields),
          routingSummary.map(selectImportantSummaryFields)
        );
      } catch (e) {
        const { logger } = new CourierLogger("Route Summary Mismatch");
        logger.warn(e);
        await routeTreeSummaryDifferedCount();
      }
    }

    if (!routingSummary.length) {
      await createUnroutableEvent(
        action.tenantId,
        messageId,
        "MISSING_PROVIDER_SUPPORT",
        "Courier was not able to select a valid Channel or Provider given the request. Please check the message's profile and data properties and try again."
      );
      return;
    }

    // TODO: Remove once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue
    const maxAge = context.variableData?.maxAge;
    if (retryCount && maxAge && !routeTreeEnabled) {
      const timedout = await handlePossibleRouteTimeout({
        retryCount,
        messageId,
        maxAge,
        routingSummary: routingSummary as any,
        tenantId,
        logger,
      });
      if (timedout) return;
    }

    if (
      (routingSummary as RoutingSummary[]).every((summary) => !summary.selected)
    ) {
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
      channelSummary: routingSummary.map((summary) => {
        if (!summary.timedout) {
          return {
            channel: summary.channel,
            provider: summary.provider,
            selected: summary.selected,
            ...(summary?.reason && { reason: summary.reason }),
            ...(summary?.conditional && { condition: summary.conditional }),
          };
        }
      }),
      preferences: mapPreferences(context.preferences),
    });

    await DeliveryProgressionMetric({
      action: SendActionCommands.Route,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
    });

    // TODO: Remove the condition once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue
    if (routeTreeEnabled) {
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
    }

    // TODO: Remove once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue
    await dispatchRouteSummaryToRenderService({
      contextFilePath,
      dryRunKey,
      messageFilePath,
      messageId,
      requestId,
      routingSummary,
      tenantId,
      translated,
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
      shouldUseRouteTree: String(shouldUseRouteTree),
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

const selectImportantSummaryFields = (summary: RoutingSummary) => {
  return {
    channel: summary.channel,
    configurationId: summary.configurationId,
    provider: summary.provider,
    taxonomy: summary.taxonomy,
    selected: summary.selected,
    id: summary.id,
  };
};
