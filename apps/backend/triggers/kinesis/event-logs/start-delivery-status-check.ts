/**
 * NB: If you are adding a new event type to be processed by this function you
 * will need to update the filtering mechanisms in two places
 * 1) The serverless.yml filterPatterns entry for the EventLogsStartCheckDeliveryStatus function
 * 2) The filter function that is invoked by createEventHandlerWithFailures at the bottom of this file
 */

import {
  createDeliveringEvent,
  EntryTypes,
  getJsonValue,
  migrateLegacyEventLogJson,
} from "~/lib/dynamo/event-logs";
import enqueue from "~/lib/enqueue";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import jsonStore from "~/lib/s3";
import providers from "~/providers";
import {
  ISafeEventLogEntry,
  S3CheckDeliveryStatusMessage,
  SqsCheckDeliveryStatusMessage,
} from "~/types.internal";

const enqueueMessage = enqueue<SqsCheckDeliveryStatusMessage>(
  process.env.SQS_CHECK_DELIVERY_STATUS_QUEUE_NAME
);
const { put: putMessage } = jsonStore<S3CheckDeliveryStatusMessage>(
  process.env.S3_MESSAGES_BUCKET
);

const handleRecord = async (event: ISafeEventLogEntry) => {
  if (event.type === EntryTypes.providerSent) {
    const { messageId, tenantId } = event;
    const json = await getJsonValue(migrateLegacyEventLogJson(event.json));

    const {
      channel,
      configuration,
      externalId,
      provider,
      providerResponse,
    } = json;

    const p = providers[provider];

    if (p && p.deliveryStatusStrategy === "POLLING") {
      await createDeliveringEvent(
        tenantId,
        messageId,
        provider,
        configuration,
        channel
      );

      const filename = messageId;
      const filePath = `${tenantId}/delivery_status_${filename}.json`;

      await putMessage(filePath, {
        providerResponse,
      });

      await enqueueMessage({
        channel,
        configuration,
        externalId,
        messageId,
        messageLocation: {
          path: filePath,
          type: "S3",
        },
        provider,
        tenantId,
        type: "check-delivery-status",
      });
    }
  }
};

export default createEventHandlerWithFailures<ISafeEventLogEntry>(
  handleRecord,
  process.env.EVENT_LOG_SEQUENCE_TABLE,
  {
    filter: (event: ISafeEventLogEntry) =>
      event.type === EntryTypes.providerSent,
  }
);
