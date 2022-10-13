import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { ISafeEventLogEntry } from "~/types.internal";
import { Unit } from "aws-embedded-metrics";

import {
  getJsonValue,
  migrateLegacyEventLogJson,
} from "~/lib/dynamo/event-logs";
import logger from "~/lib/logger";
import eventHandlers from "./event-handlers";
import { CourierEmf } from "~/lib/courier-emf";

async function handler(event: ISafeEventLogEntry) {
  const eventHandler = eventHandlers[event.type];

  logger.debug(`tenantId: ${event.tenantId}`);
  logger.debug(`event type: ${event.type}`);
  logger.debug(`message: ${event.messageId}`);

  if (!eventHandler) {
    return;
  }

  const json = await getJsonValue(migrateLegacyEventLogJson(event.json));
  await eventHandler({ ...event, json });
  await eventLogMetrics(event);
}

async function eventLogMetrics(event: ISafeEventLogEntry) {
  const { type, tenantId, messageId } = event;
  const emf = new CourierEmf("eventLogMetrics");
  emf.addDimensions([{ Triggers: "Kinesis" }, { Handler: "Event Logs" }]);
  emf.addProperties([{ tenantId, messageId }]);
  emf.addMetrics([{ metricName: type, unit: Unit.Count, value: 1 }]);
  await emf.end();
}

export default createEventHandlerWithFailures<ISafeEventLogEntry>(
  handler,
  process.env.EVENT_LOG_SEQUENCE_TABLE,
  {
    filter: (event: ISafeEventLogEntry) =>
      eventHandlers[event.type] !== undefined,
  }
);
