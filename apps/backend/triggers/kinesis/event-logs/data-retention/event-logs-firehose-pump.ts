import {
  getJsonValue,
  migrateLegacyEventLogJson,
} from "~/lib/dynamo/event-logs";
import createEventHandler from "~/lib/kinesis/create-event-handler";
import { ISafeEventLogEntry } from "~/types.internal";
import { putRecord } from "~/lib/kinesis/firehose";
import getEnvVar from "~/lib/get-environment-variable";
import truncateLongStrings from "~/lib/truncate-long-strings-v2";

const firehoseDeliveryStreamName = getEnvVar("EVENT_LOGS_FIREHOSE_STREAM");

export const handleRecord = async (
  event: ISafeEventLogEntry
): Promise<void> => {
  const json = await getJsonValue(migrateLegacyEventLogJson(event.json));
  const truncated = truncateLongStrings(json, { truncateAtKiB: 10 });

  await putRecord({
    DeliveryStreamName: firehoseDeliveryStreamName,
    Record: {
      Data: JSON.stringify({
        ...event,
        json: truncated,
      }),
    },
  });
};

export default createEventHandler<ISafeEventLogEntry>(handleRecord);
