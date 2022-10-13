/**
 * NB: If you are adding a new event type to be processed by this function you
 * will need to update the filtering mechanisms in two places
 * 1) The serverless.yml filterPatterns entry for the EventLogsDailyMetrics function
 * 2) Add the event type to the `SUPPORTED` array of items used for filtering
 */

import { incrementMetrics } from "~/lib/daily-metrics-service";
import { MetricIncrement } from "~/lib/daily-metrics-service/types";
import {
  EntryTypes,
  getJsonValue,
  migrateLegacyEventLogJson,
} from "~/lib/dynamo/event-logs";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { EventLogEntryType } from "~/types.api";
import { ISafeEventLogEntry } from "~/types.internal";

const SUPPORTED: EventLogEntryType[] = [
  EntryTypes.eventClick,
  EntryTypes.eventOpened,
  EntryTypes.providerDelivered,
  EntryTypes.providerError,
  EntryTypes.providerSent,
];

const handleRecord = async (event: ISafeEventLogEntry) => {
  const { tenantId, timestamp } = event;
  const json = await getJsonValue(migrateLegacyEventLogJson(event.json));

  switch (event.type) {
    case EntryTypes.eventClick:
      await incrementMetrics(
        tenantId,
        timestamp,
        `${json.providerKey}_totalClicked`
      );
      break;

    case EntryTypes.eventOpened:
      await incrementMetrics(
        tenantId,
        timestamp,
        `${json.providerKey}_totalOpened`
      );
      break;

    case EntryTypes.providerDelivered:
      await incrementMetrics(
        tenantId,
        timestamp,
        `${json.provider}_delivered`,
        "delivered"
      );
      break;

    case EntryTypes.providerError:
      const errorMetrics: MetricIncrement[] = ["errors"];

      if (json.provider) {
        errorMetrics.push(`${json.provider}_errors`);
      }

      await incrementMetrics(tenantId, timestamp, ...errorMetrics);
      break;

    case EntryTypes.providerSent:
      await incrementMetrics(
        tenantId,
        timestamp,
        `${json.provider}_sent`,
        "sent"
      );
      break;
  }
};

export default createEventHandlerWithFailures<ISafeEventLogEntry>(
  handleRecord,
  process.env.EVENT_LOG_SEQUENCE_TABLE,
  {
    filter: (event: ISafeEventLogEntry) => SUPPORTED.includes(event.type),
  }
);
