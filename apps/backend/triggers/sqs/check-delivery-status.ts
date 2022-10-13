import { SQSEvent } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import { get as getConfiguration } from "~/lib/configurations-service";
import {
  createDeliveredEvent,
  createPollingAttemptEvent,
  createPollingErrorEvent,
  createUndeliverableEvent,
} from "~/lib/dynamo/event-logs";
import retryMessage from "~/lib/dynamo/retry-message-v2";
import enqueue from "~/lib/enqueue";
import getTtl from "~/lib/get-ttl";
import handleErrorLog from "~/lib/handle-error-log";
import { error } from "~/lib/log";
import jsonStore from "~/lib/s3";
import providers from "~/providers";
import {
  CheckDeliveryStatusError,
  ProviderResponseError,
} from "~/providers/errors";
import {
  LegacySqsCheckDeliveryStatusMessage,
  S3CheckDeliveryStatusMessage,
  SqsCheckDeliveryStatusMessage,
} from "~/types.internal";

const enqueueMessage = enqueue<SqsCheckDeliveryStatusMessage>(
  process.env.SQS_CHECK_DELIVERY_STATUS_QUEUE_NAME
);
const { get } = jsonStore<S3CheckDeliveryStatusMessage>(
  process.env.S3_MESSAGES_BUCKET
);
const { put: putMessage } = jsonStore<S3CheckDeliveryStatusMessage>(
  process.env.S3_MESSAGES_BUCKET
);

/*
  [<Retry Count>, <Interval in minutes>]
*/
const getTtlOverrides = {
  intervalMap: new Map([
    [6, 1],
    [7, 1],
    [8, 2],
    [9, 3],
    [10, 5],
  ]),
};

function assertIsLegacy(
  message: SqsCheckDeliveryStatusMessage | LegacySqsCheckDeliveryStatusMessage
): message is LegacySqsCheckDeliveryStatusMessage {
  return !("messageLocation" in message);
}

// Ensures messages that were retrying or in the old structure get converted
// into the new one.
const getSupportedMessage = async (
  message: LegacySqsCheckDeliveryStatusMessage
): Promise<SqsCheckDeliveryStatusMessage> => {
  const { providerResponse, ...rest } = message;

  const filename = message.messageId;
  const filePath = `${message.tenantId}/delivery_status_${filename}.json`;

  await putMessage(filePath, {
    providerResponse,
  });

  return {
    ...rest,
    messageLocation: {
      path: filePath,
      type: "S3",
    },
  };
};

const checkDeliveryStatus = async (
  rawMessage:
    | SqsCheckDeliveryStatusMessage
    | LegacySqsCheckDeliveryStatusMessage
): Promise<void> => {
  const message = assertIsLegacy(rawMessage)
    ? await getSupportedMessage(rawMessage)
    : rawMessage;
  const {
    channel,
    configuration: configurationId,
    messageId,
    provider: providerKey,
    retryCount,
    tenantId,
  } = message;

  try {
    let messageDetails: S3CheckDeliveryStatusMessage;

    switch (message.messageLocation.type) {
      case "S3":
        messageDetails = await get(message.messageLocation.path);
        break;
      case "JSON":
        messageDetails = message.messageLocation.path;
        break;
    }

    const { providerResponse } = messageDetails;
    const provider = providers[providerKey];

    if (!provider) {
      throw new CheckDeliveryStatusError(`Unknown Provider ${providerKey}`);
    }

    if (!provider.deliveryStatusStrategy) {
      return;
    }

    const configuration = await getConfiguration({
      id: configurationId,
      tenantId,
    });
    if (!configuration) {
      throw new CheckDeliveryStatusError("Unable to find configuration");
    }

    if (!provider.getDeliveryStatusEnabled(configuration)) {
      return;
    }

    if (provider.deliveryStatusStrategy !== "POLLING") {
      throw new CheckDeliveryStatusError(
        `Provider ${providerKey} does not support checking message status via other methods.`
      );
    }

    const pr =
      typeof providerResponse === "string"
        ? JSON.parse(providerResponse)
        : providerResponse;
    const externalId = provider.getExternalId(pr);
    // Providers like MailGun are starting to give responses where there isn't
    // an id to use for delivery checking. For now, bail out of the pipeline.
    if (!externalId?.length) {
      return;
    }

    const { status, reason, reasonCode, reasonDetails, response } =
      await provider.getDeliveryStatus(externalId, configuration, tenantId);

    switch (status) {
      case "DELIVERED":
        await createDeliveredEvent(
          tenantId,
          messageId,
          providerKey,
          configurationId,
          response || providerResponse,
          channel
        );
        break;
      case "SENT":
        const newRetryCount = retryCount ? retryCount + 1 : 1;
        const ttl =
          response?.ttl ??
          getTtl(
            newRetryCount,
            provider?.getDeliveryStatusIntervalOverrides ?? getTtlOverrides
          );
        const newMessage = {
          ...message,
          retryCount: newRetryCount,
          ttl,
        };

        ttl ? await retryMessage(newMessage) : await enqueueMessage(newMessage);

        try {
          await createPollingAttemptEvent(
            tenantId,
            messageId,
            providerKey,
            newRetryCount,
            message.ttl,
            newMessage.ttl,
            response && response.reason,
            response && response.data
          );
        } catch (err) {
          // The message is in a queue. An exception here would introduce a duplicate message.
          error(err);
        }

        break;
      case "SENT_NO_RETRY":
        try {
          await createPollingErrorEvent(
            tenantId,
            messageId,
            response && response.reason,
            message.provider,
            retryCount,
            response && response.data
          );
        } catch (err) {
          // The message is in a queue. An exception here would introduce a duplicate message.
          error(err);
        }
        break;
      case "UNDELIVERABLE":
        await createUndeliverableEvent(
          tenantId,
          messageId,
          reason,
          reasonDetails,
          {
            channel,
            provider: providerKey,
            reasonCode,
            ...response,
            deliveryStatusCheckFailed: true,
          }
        );
        break;
    }

    return;
  } catch (err) {
    handleErrorLog(err);

    let errorMessage: string;
    let errorData: object;
    if (err instanceof CheckDeliveryStatusError) {
      errorMessage = err.message;
    } else if (err instanceof ProviderResponseError) {
      errorMessage = err.toString();
      errorData = err.payload;
    } else {
      errorMessage = "Internal Courier Error";
    }

    await createPollingErrorEvent(
      message.tenantId,
      message.messageId,
      errorMessage,
      message.provider,
      message.retryCount,
      errorData
    );

    const newRetryCount = message.retryCount ? message.retryCount + 1 : 1;
    const ttl = getTtl(newRetryCount, getTtlOverrides);
    const updatedMessage = {
      ...message,
      retryCount: newRetryCount,
      ttl,
    };

    // Put an updated message back into queue with bumped retry count
    if (!ttl) {
      await enqueueMessage(updatedMessage);
      return;
    }

    // 25 Retries is 72+ hours of TTL
    if (newRetryCount <= 25) {
      await retryMessage(updatedMessage);
      return;
    }
  }
};

export async function handle(ev: SQSEvent) {
  await Promise.all(
    ev.Records.map(async (r) => {
      try {
        const msg = (
          typeof r.body === "string" ? JSON.parse(r.body) : r.body
        ) as SqsCheckDeliveryStatusMessage;
        return await checkDeliveryStatus(msg);
      } catch (err) {
        error(err);
        await captureException(err);
        throw err;
      }
    })
  );
}
