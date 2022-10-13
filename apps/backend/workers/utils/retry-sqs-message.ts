import retryMessage from "~/lib/dynamo/retry-message-v2";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import getTtl from "~/lib/get-ttl";
import logger from "~/lib/logger";
import { SqsPrepareMessage, SqsRouteMessage } from "~/types.internal";

const MAX_SQS_RETRIES = 10;
const MAX_RETRIES = 25;

const RETRY_DELAYS_BY_RETRY_COUNT = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 60,
  7: 120,
  8: 240,
  9: 480,
  10: 600,
};

const getRetryCount = (
  message: SqsPrepareMessage | SqsRouteMessage
): number => {
  return message?.retryCount ? message.retryCount + 1 : 1;
};

const retriesAvailable = (retryCount: number): boolean => {
  return retryCount <= MAX_RETRIES;
};

export const isRetryable = (message: SqsPrepareMessage | SqsRouteMessage) => {
  const retryCount = getRetryCount(message);
  return retriesAvailable(retryCount);
};

export async function retrySqsMessage(
  message: SqsPrepareMessage | SqsRouteMessage
) {
  const retryCount = getRetryCount(message);

  // bail out if we exhaust max retries
  if (!retriesAvailable(retryCount)) {
    return;
  }

  const ttl = getTtl(retryCount);

  const newMessage = {
    ...message,
    retryCount,
    ttl,
  };
  // for first 10 retries, we use DelaySeconds from SQS
  // increasing the delay by 30 seconds for each retry up to 10 retries
  if (retryCount <= MAX_SQS_RETRIES) {
    const delaySeconds = RETRY_DELAYS_BY_RETRY_COUNT[retryCount];
    logger.debug(
      `Retrying message in ${newMessage.type} with DelaySeconds:- ${delaySeconds}`
    );
    switch (newMessage.type) {
      case "prepare":
        await enqueueByQueueUrl<SqsPrepareMessage>(
          process.env.SQS_PREPARE_QUEUE_URL,
          delaySeconds
        )(newMessage);
        return;
      case "route":
        await enqueueByQueueUrl<SqsRouteMessage>(
          process.env.SQS_ROUTE_QUEUE_URL,
          delaySeconds
        )(newMessage);
        return;
    }
  } else {
    // transition to dynamo backed retries
    await retryMessage(newMessage);
    return;
  }
}
