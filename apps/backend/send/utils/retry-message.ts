import { nanoid } from "nanoid";
import { put } from "~/lib/dynamo";
import {
  createRetryingEvent,
  createTimedoutEvent,
} from "~/lib/dynamo/event-logs";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import getTtl from "~/lib/get-ttl";
import { CourierLogger } from "~/lib/logger";
import {
  getRouteNode,
  isRouteLeafTimedOut,
  RouteNode,
  RouteNodeAddress,
  RouteTimeoutTable,
  SendTimes,
} from "~/lib/send-routing";
import { failover, FailoverOpts } from "./failover";

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

const MAX_RETRIES = 25;

interface IRetryMessage {
  streamName: string;
  retryCount?: number;
  [key: string]: any;
}

export interface RetryMessageFailoverOpts extends FailoverOpts {
  timeouts?: RouteTimeoutTable;
  tree?: RouteNode;
}

export async function retryMessage(
  message: IRetryMessage,
  opts?: RetryMessageFailoverOpts
) {
  const retryCount = getRetryCount(message);
  const { logger } = new CourierLogger("retryMessage");
  const { messageId, tenantId } = message;
  const delaySeconds = RETRY_DELAYS_BY_RETRY_COUNT[retryCount];

  // Can no longer retry with current provider. Send back to router for failover
  if (hasExceededMaxRetries(retryCount) || isTimedout(opts)) {
    return await Promise.all([
      createTimedoutEvent(tenantId, messageId, {
        channel: message.channel,
        provider: message.provider,
        time: new Date().toISOString(),
      }),
      failover({ ...opts, messageId }),
    ]);
  }

  await createRetryingEvent(tenantId, messageId, { retryCount });

  const newMessage = {
    ...message,
    retryCount,
    streamName: message.streamName,
  };

  // for first 10 retries, we use DelaySeconds from SQS
  // increasing the delay by 30 seconds for each retry up to 10 retries
  if (retryCount <= 10) {
    logger.debug(
      `retryMessage using SQS Visibility Timeout:- ${delaySeconds}, retry count:-${retryCount}`
    );
    await enqueueByQueueUrl<IRetryMessage>(
      process.env.RETRY_SEND_QUEUE_URL,
      delaySeconds
    )(newMessage);
    return;
  }

  const ttl = getTtl(retryCount);

  logger.debug(
    `retryMessage using Dynamo TTL:- ${ttl}, retry count:-${retryCount}`
  );

  try {
    await put({
      Item: {
        ...newMessage,
        pk: nanoid(),
        ttl,
      },
      TableName: process.env.RETRY_TABLE,
    });
    return;
  } catch (error) {
    logger.error("Retry message put failed", newMessage);
    throw error;
  }
}

interface IsTimedoutOpts {
  tree?: RouteNode;
  times?: SendTimes;
  timeouts?: RouteTimeoutTable;
  address?: RouteNodeAddress;
}

const isTimedout = (opts?: IsTimedoutOpts): boolean => {
  if (!opts) return false;
  const { address, tree, timeouts, times } = opts;
  if (!address || !tree || !timeouts || !times) return false;
  const leaf = getRouteNode(address, tree);

  if (!leaf || leaf.type !== "leaf") {
    console.warn(`Leaf not found for address ${address}`);
    return false;
  }

  return isRouteLeafTimedOut({ leaf, times, timeouts });
};

const getRetryCount = (message: IRetryMessage): number => {
  return message?.retryCount ? message.retryCount + 1 : 1;
};

const hasExceededMaxRetries = (retryCount: number): boolean => {
  return retryCount > MAX_RETRIES;
};
