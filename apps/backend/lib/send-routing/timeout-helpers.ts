import {
  ChannelTimeout,
  MessageChannels,
  MessageProviders,
  Timeout,
} from "~/api/send/types";
import { currentTimeIso, currentTimeMs } from "~/lib/utils";
import { PricingPlan } from "~/lib/plan-pricing";
import { getAllRouteLeafs } from "./lib";
import { SendTimes, RouteLeaf, RouteNode, RouteTimeoutTable } from "./types";

const DEFAULT_MESSAGE_TIMEOUT = 259200000; // 72 hours
const DEFAULT_CHANNEL_TIMEOUT = 1800000; // 30 minutes
const DEFAULT_PROVIDER_TIMEOUT = 300000; // 5 minutes

export const getTimedOutLeafs = ({
  tree,
  times,
  timeouts,
}: {
  tree: RouteNode;
  times: SendTimes;
  timeouts: RouteTimeoutTable;
}): RouteLeaf[] => {
  return getAllRouteLeafs(tree, { includeFailoverBranches: true }).filter(
    (leaf) => isRouteLeafTimedOut({ leaf, timeouts, times })
  );
};

export const isRouteLeafTimedOut = ({
  leaf,
  times,
  timeouts,
}: {
  leaf: RouteLeaf;
  times: SendTimes;
  timeouts: RouteTimeoutTable;
}): boolean => {
  const currentTime = currentTimeMs();
  const messageSendTimeMs = new Date(times.message).getTime();
  const messageTimeoutDate = messageSendTimeMs + timeouts.message;

  if (currentTime >= messageTimeoutDate) return true;

  // Non Custom Pricing Tier plans only have message level timeouts
  if (!("channel" in timeouts) || !("provider" in timeouts)) return false;

  // If channelSendTime doesn't exist, we haven't sent with that channel yet so it could not have timed out.
  const channelSendTime = times.channels[leaf.channel];
  if (!channelSendTime) return false;
  const channelSendTimeMs = new Date(channelSendTime).getTime();

  const providerTimeoutMs =
    timeouts.providers?.[leaf.provider] ??
    timeouts.channels?.[leaf.channel]?.provider ??
    timeouts.provider;

  const channelTimeoutMs =
    timeouts.channels?.[leaf.channel]?.channel ?? timeouts.channel;

  const providerTimeoutDate =
    providerTimeoutMs * leaf.providerFailoverIndex + channelSendTimeMs;
  const channelTimeoutDate = channelTimeoutMs + channelSendTimeMs;

  const xDates = [providerTimeoutDate, channelTimeoutDate];
  return xDates.some((xDate) => currentTime >= xDate);
};

export const setSendTimesForLeafs = (
  leafs: RouteLeaf[],
  base?: SendTimes
): SendTimes => {
  const channels = leafs.reduce(
    (times, leaf) => ({
      ...times,
      [leaf.channel]: times[leaf.channel] ?? currentTimeIso(),
    }),
    base?.channels ?? {}
  );

  return {
    message: base?.message ?? currentTimeIso(),
    channels,
  };
};

export function getTimeoutTable({
  timeout,
  channels,
  providers,
  plan,
}: {
  timeout?: Timeout;
  channels?: MessageChannels;
  providers?: MessageProviders;
  plan: PricingPlan;
}): RouteTimeoutTable {
  const message = timeout?.message ?? DEFAULT_MESSAGE_TIMEOUT;

  if (plan !== "custom") {
    return { message };
  }

  const channel =
    typeof timeout?.channel === "number"
      ? timeout.channel
      : DEFAULT_CHANNEL_TIMEOUT;
  const provider =
    typeof timeout?.provider === "number"
      ? timeout.provider
      : DEFAULT_PROVIDER_TIMEOUT;
  const baseChannelRecord =
    typeof timeout?.channel === "object" ? timeout.channel : undefined;
  const baseProviderRecord =
    typeof timeout?.provider === "object" ? timeout.provider : undefined;

  return {
    channel, // Defaults to 30 minutes,
    channels: getChannelTimeouts(channels, baseChannelRecord),
    message,
    provider, // Defaults to 5 minutes
    providers: getProviderTimeouts(providers, baseProviderRecord),
  };
}

function getProviderTimeouts(
  providers?: MessageProviders,
  /** Used for backwards compat with Timeout.providers record format */
  recordFormat: { [provider: string]: number } = {}
): {
  [key: string]: number; // Epoch Seconds
} {
  if (!providers) {
    return recordFormat;
  }

  return Object.entries(providers).reduce((acc, [provider, config]) => {
    if (typeof config.timeout === "number") {
      acc[provider] = config.timeout;
    }

    return acc;
  }, recordFormat);
}

function getChannelTimeouts(
  channels?: MessageChannels,
  /** Used for backwards compat with Timeout.channels record format */
  recordFormat: { [channel: string]: number } = {}
): {
  [channel: string]: ChannelTimeout<number>; // Epoch Seconds
} {
  const base = Object.entries(recordFormat).reduce(
    (acc, [channel, timeout]) => {
      acc[channel] = { channel: timeout };
      return acc;
    },
    {}
  );

  if (!channels) {
    return base;
  }

  return Object.entries(channels).reduce((acc, [channel, config]) => {
    if (typeof config.timeout === "number") {
      acc[channel] = { channel: config.timeout };
    }

    if (typeof config.timeout === "object") {
      acc[channel] = {
        channel: config.timeout.channel,
        provider: config.timeout.provider,
      };
    }

    return acc;
  }, base);
}
