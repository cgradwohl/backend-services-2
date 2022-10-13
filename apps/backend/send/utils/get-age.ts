import { PricingPlan } from "~/lib/plan-pricing";
import { LoggerOptions, Logger } from "pino";
import {
  ChannelTimeout,
  MessageChannels,
  MessageProviders,
  Timeout,
  TimeoutDateEpochSeconds,
  TimeoutDateIso8601,
} from "~/api/send/types";
import { createTimedoutEvent } from "~/lib/dynamo/event-logs";
import { RoutingSummary } from "~/lib/send-routing";
import { IRoutingSummary } from "../worker/commands/route/types";

/** @deprecated */
export function getMaxAge({
  timeout,
  channels,
  providers,
  plan,
}: {
  timeout?: Timeout;
  channels?: MessageChannels;
  providers?: MessageProviders;
  plan: PricingPlan;
}): TimeoutDateEpochSeconds {
  const message = getExpirationAge(timeout?.message ?? 259200000);

  if (plan !== "custom") {
    return { message };
  }

  const channelTimeout =
    typeof timeout?.channel === "number" ? timeout.channel : 1800000; // Defaults to 30 minutes
  const providerTimeout =
    typeof timeout?.provider === "number" ? timeout.provider : 300000; // Defaults to 5 minutes
  const baseChannelRecord =
    typeof timeout?.channel === "object" ? timeout.channel : undefined;
  const baseProviderRecord =
    typeof timeout?.provider === "object" ? timeout.provider : undefined;

  return {
    channel: getExpirationAge(channelTimeout), // Defaults to 30 minutes,
    channels: getChannelTimeouts(channels, baseChannelRecord),
    message, // Defaults to 72hrs
    provider: getExpirationAge(providerTimeout), // Defaults to 5 minutes
    providers: getProviderTimeouts(providers, baseProviderRecord),
  };
}

/** @deprecated */
export function getReadableAge({
  timeout,
}: {
  timeout: TimeoutDateEpochSeconds;
}): TimeoutDateIso8601 {
  return {
    channel: convertUnixEpochToIso(timeout.channel),
    channels: getReadableChannelsAge(timeout.channels),
    message: convertUnixEpochToIso(timeout.message),
    provider: convertUnixEpochToIso(timeout.provider),
    providers: getReadableProvidersAge(timeout.providers),
  };
}

/** @deprecated */
const getReadableProvidersAge = (providers?: { [key: string]: number }) =>
  Object.entries(providers ?? {}).reduce(
    (acc, [provider, timeout]) => ({
      ...acc,
      [provider]: convertUnixEpochToIso(timeout),
    }),
    {}
  );

/** @deprecated */
const getReadableChannelsAge = (
  channels?: TimeoutDateEpochSeconds["channels"]
) =>
  Object.entries(channels ?? {}).reduce(
    (acc, [channel, config]) => ({
      ...acc,
      [channel]: {
        channel: convertUnixEpochToIso(config.channel),
        provider: convertUnixEpochToIso(config.provider),
      },
    }),
    {}
  );

/** @deprecated */
export function getProviderTimeouts(
  providers?: MessageProviders,
  /** Used for backwards compat with Timeout.providers record format */
  recordFormat: { [provider: string]: number } = {}
): {
  [key: string]: number; // Epoch Seconds
} {
  const base = Object.entries(recordFormat).reduce(
    (acc, [provider, timeout]) => {
      acc[provider] = getExpirationAge(timeout);
      return acc;
    },
    {}
  );

  if (!providers) {
    return base;
  }

  return Object.entries(providers).reduce((acc, [provider, config]) => {
    if (typeof config.timeout === "number") {
      acc[provider] = getExpirationAge(config.timeout);
    }

    return acc;
  }, base);
}

/** @deprecated */
export function getChannelTimeouts(
  channels?: MessageChannels,
  /** Used for backwards compat with Timeout.channels record format */
  recordFormat: { [channel: string]: number } = {}
): {
  [channel: string]: ChannelTimeout<number>; // Epoch Seconds
} {
  const base = Object.entries(recordFormat).reduce(
    (acc, [channel, timeout]) => {
      acc[channel] = { channel: getExpirationAge(timeout) };
      return acc;
    },
    {}
  );

  if (!channels) {
    return base;
  }

  return Object.entries(channels).reduce((acc, [channel, config]) => {
    if (typeof config.timeout === "number") {
      acc[channel] = { channel: getExpirationAge(config.timeout) };
    }

    if (typeof config.timeout === "object") {
      acc[channel] = {
        channel: getExpirationAge(config.timeout.channel),
        provider: getExpirationAge(config.timeout.provider),
      };
    }

    return acc;
  }, base);
}

export function getCurrentAgeInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function getExpirationAge(timeout: number): number {
  return Math.floor((Date.now() + timeout) / 1000);
}

function convertUnixEpochToIso(date?: number): string | undefined {
  if (typeof date !== "number") {
    return undefined;
  }

  return new Date(date * 1000).toISOString();
}

/** @deprecated */
export function isTimedout({
  channel,
  maxAge,
  provider,
}: {
  channel: string;
  maxAge: TimeoutDateEpochSeconds;
  provider?: string;
}) {
  const currentTime = getCurrentAgeInSeconds();

  if (!("channel" in maxAge) || !("provider" in maxAge)) {
    return maxAge.message <= currentTime;
  }

  const providerTimeoutDate =
    maxAge.providers?.[provider] ??
    maxAge.channels?.[channel]?.provider ??
    maxAge.provider;

  const channelTimeoutDate =
    maxAge.channels?.[channel]?.channel ?? maxAge.channel;

  const timedout =
    (provider && providerTimeoutDate <= currentTime) ||
    channelTimeoutDate <= currentTime ||
    maxAge.message <= currentTime;

  return timedout;
}

/** @deprecated Returns true if we timed out */
export async function handlePossibleTimeout({
  maxAge,
  channel,
  provider,
  tenantId,
  messageId,
  retryCount,
}: {
  retryCount: number;
  maxAge: TimeoutDateEpochSeconds;
  channel: string;
  provider: string;
  tenantId: string;
  messageId: string;
}): Promise<boolean> {
  if (!retryCount) {
    return false;
  }

  const timedout = isTimedout({
    channel,
    maxAge,
    provider,
  });

  if (timedout) {
    await createTimedoutEvent(tenantId, messageId, {
      type: "TIMEDOUT",
      reason: `Courier was not able to render the message because it timedout`,
      currentTime: getCurrentAgeInSeconds(),
      provider,
      channel,
      timeout: getReadableAge({ timeout: maxAge }),
    });
  }

  return timedout;
}

/** @deprecated - returns true if timed out */
export async function handlePossibleRouteTimeout({
  retryCount,
  maxAge,
  routingSummary,
  translateToV2,
  logger,
  tenantId,
  messageId,
}: {
  maxAge?: TimeoutDateEpochSeconds;
  retryCount: number;
  routingSummary: (RoutingSummary & IRoutingSummary)[];
  translateToV2?: boolean;
  logger: Logger<LoggerOptions>;
  tenantId: string;
  messageId: string;
}) {
  if (!retryCount || !maxAge) return false;

  const timedOutRoutingSummary = routingSummary.map((route) => {
    const timedout = isTimedout({
      channel: route.channel,
      maxAge,
      provider: route.provider,
    });

    route.timedout = timedout;
    return route;
  });

  await Promise.all(
    timedOutRoutingSummary.map((route) => {
      if (!route.timedout) return;
      const toEvent = {
        type: "TIMEDOUT",
        reason: `Courier was not able to route the message because it timedout`,
        currentTime: getCurrentAgeInSeconds(),
        provider: route.provider,
        channel: route.channel,
        timeout: getReadableAge({ timeout: maxAge }),
      };

      if (translateToV2) {
        logger.warn({ tenantId, messageId, toEvent });
        return;
      }

      return createTimedoutEvent(tenantId, messageId, toEvent);
    })
  );

  if (timedOutRoutingSummary.every((summary) => summary.timedout)) {
    const toEvent = {
      type: "TIMEDOUT",
      reason: `Courier was not able to route the message because it timedout`,
      currentTime: getCurrentAgeInSeconds(),
      routingSummary,
      timeout: getReadableAge({ timeout: maxAge }),
    };

    if (translateToV2) {
      logger.warn({ tenantId, messageId, toEvent });
      return;
    }

    await createTimedoutEvent(tenantId, messageId, toEvent);
    return true;
  }
}
