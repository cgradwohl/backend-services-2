import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { actionCommands } from "./commands";
import { IAction } from "../types";
import { CourierLogger } from "~/lib/logger";
import { NonRetryableSendError } from "../errors/types";
import { retryMessage } from "../utils/retry-message";
import { sendErrorMetric } from "~/lib/courier-emf/logger-metrics-utils";
const { logger } = new CourierLogger("ActionWorkerLogger");

async function worker(action: IAction) {
  try {
    const command = actionCommands[action.command];

    await command(action);
  } catch (error: unknown) {
    logger.error(`:: ${action?.command} COMMAND ERROR ::`, {
      action,
      error,
      tenantId: action?.tenantId,
      traceId: action?.requestId,
    });

    await sendErrorMetric({
      action,
      error,
      tenantId: action?.tenantId,
      traceId: action?.requestId,
    });

    // NOTE: This limits the scope of the new Error Retry Policy.
    // TODO: Remove after all command errors have been classified
    if (
      [
        "accept",
        "ad-hoc-list",
        "list",
        "list-pattern",
        "request",
        "route",
        "send-audiences",
        "send-audiences-member",
      ].includes(action?.command)
    ) {
      // an explicit non retryable error was thrown, so don't retry
      if (error instanceof NonRetryableSendError) {
        return;
      }

      await retryMessage({
        ...action,
        streamName: process.env.ACTION_STREAM!,
      });
    }
  }
}

export default createEventHandlerWithFailures<IAction>(
  worker,
  process.env.ACTION_STREAM_SEQUENCE_TABLE
);
