/**
 * NB: If you are adding a new event type to be processed by this function you
 * will need to update the filtering mechanisms in two places
 * 1) The serverless.yml filterPatterns entry for the UpdateMessageBilledUnits function
 * 2) Add the event type to the `SUPPORTED` array of items used for filtering
 */

import { EntryTypes } from "~/lib/dynamo/event-logs";
import { setBilledUnits } from "~/lib/dynamo/messages";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { EventLogEntryType } from "~/types.api";
import { ISafeEventLogEntry } from "~/types.internal";

const SUPPORTED: EventLogEntryType[] = [
  EntryTypes.providerError,
  EntryTypes.providerSent,
  EntryTypes.undeliverable,
];

async function handler(event: ISafeEventLogEntry) {
  const { messageId, tenantId, type } = event;

  // keeping this just as a safety precaution. this should never happen.
  if (!SUPPORTED.includes(type)) {
    return;
  }

  const billedUnits = 1.0;

  await setBilledUnits(tenantId, messageId, billedUnits);
}

export default createEventHandlerWithFailures<ISafeEventLogEntry>(
  handler,
  process.env.EVENT_LOG_SEQUENCE_TABLE,
  {
    filter: (event: ISafeEventLogEntry) => SUPPORTED.includes(event.type),
  }
);
