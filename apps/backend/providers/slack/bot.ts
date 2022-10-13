import { ErrorCode, WebClient as Slack } from "@slack/web-api";

import {
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

import { ISlackMessage } from "./send";

import removeUnicodeFromAccessToken from "../lib/parse-unicode-access-token";

// From https://api.slack.com/methods/chat.postMessage.
const retryableErrorCodes: Readonly<string[]> = [
  "accesslimited",
  "fatal_error",
  "internal_error",
  "org_login_required",
  "rate_limited",
  "ratelimited",
  "request_timeout",
  "service_unavailable",
];

export interface ISlackBotProfile {
  access_token: string;
  channel?: string;
  user_id?: string;
  email?: string;
}

/**
 * Check for Courier recommended way:
 * ```
 * {
 *    // required
 *    access_token: string,
 *
 *    // one of the following:
 *    channel: string,
 *    user_id: string,
 *    email: string,
 * }
 * ```
 */
export const getCourierSlackProfile = (profile: {
  slack?: any;
}): ISlackBotProfile | undefined => {
  if (!profile.slack || typeof profile.slack !== "object") {
    return;
  }

  const { slack } = profile;

  if (
    slack.access_token &&
    typeof slack.access_token === "string" &&
    ((slack.channel && typeof slack.channel === "string") ||
      (slack.user_id && typeof slack.user_id === "string") ||
      (slack.email && typeof slack.email === "string"))
  ) {
    return {
      access_token: removeUnicodeFromAccessToken(slack.access_token),
      channel: slack.channel,
      email: slack.email,
      user_id: slack.user_id,
    };
  }
};

/**
 * Check for Slack OAuth v2 format:
 * ```
 * {
 *    access_token: string,
 *    authed_user: {
 *      id: string
 *    }
 * }
 * ```
 */
export const getV2SlackProfile = (profile: {
  slack?: any;
}): ISlackBotProfile | undefined => {
  if (!profile.slack || typeof profile.slack !== "object") {
    return;
  }

  const { slack } = profile;

  if (
    slack.access_token &&
    typeof slack.access_token === "string" &&
    slack.authed_user &&
    typeof slack.authed_user === "object" &&
    slack.authed_user.id &&
    typeof slack.authed_user.id === "string"
  ) {
    return {
      access_token: removeUnicodeFromAccessToken(slack.access_token),
      user_id: slack.authed_user.id,
    };
  }
};

/**
 * Check for Slack OAuth v1 format:
 * ```
 * {
 *    user_id: string,
 *    bot: {
 *      bot_access_token: string
 *    }
 * }
 * ```
 */
export const getV1SlackProfile = (profile: {
  slack?: any;
}): ISlackBotProfile | undefined => {
  if (!profile.slack || typeof profile.slack !== "object") {
    return;
  }

  const { slack } = profile;

  if (
    slack.user_id &&
    typeof slack.user_id === "string" &&
    slack.bot &&
    typeof slack.bot === "object" &&
    slack.bot.bot_access_token &&
    typeof slack.bot.bot_access_token === "string"
  ) {
    return {
      access_token: slack.bot.bot_access_token,
      user_id: slack.user_id,
    };
  }
};

/**
 * Check for depricated legacy format:
 * ```
 * {
 *    slackChannel: string,
 *    slackToken: string,
 * }
 * ```
 */
export const getLegacySlackProfile = (profile: {
  slackChannel?: any;
  slackToken?: any;
}): ISlackBotProfile | undefined => {
  if (
    !profile.slackChannel ||
    typeof profile.slackChannel !== "string" ||
    !profile.slackToken ||
    typeof profile.slackToken !== "string"
  ) {
    return;
  }

  return {
    access_token: removeUnicodeFromAccessToken(profile.slackToken),
    channel: profile.slackChannel,
  };
};

/**
 * Check profile for a slack config and return in standard format
 */
export const getSlackBotProfile = (profile: {
  slack?: any;
  slackChannel?: any;
  slackToken?: any;
}): ISlackBotProfile | undefined => {
  return (
    getCourierSlackProfile(profile) ||
    getV2SlackProfile(profile) ||
    getV1SlackProfile(profile) ||
    getLegacySlackProfile(profile)
  );
};

const getSlackUserId = async (
  email: string,
  client: Slack
): Promise<string> => {
  const lookup = await client.users.lookupByEmail({
    email,
  });

  return (lookup as any).user.id;
};

const getSlackChannel = async (botProfile: ISlackBotProfile, client: Slack) => {
  if (botProfile.channel) {
    return botProfile.channel;
  }

  const userId =
    botProfile.user_id || (await getSlackUserId(botProfile.email, client));

  const lookup = await client.conversations.open({
    users: userId,
  });

  return (lookup as any).channel.id;
};

export const slackBotSend = async (
  botProfile: ISlackBotProfile,
  message: ISlackMessage,
  ts: string,
  options?: {
    blocks?: ISlackMessage["blocks"];
  }
) => {
  // We add rejectRateLimitedCalls: true in order to improve error reporting for rate limited errors.
  // Without this configuration, we never receive ErrorCode.RateLimitedError in the error.code and directly throw error.
  const client = new Slack(botProfile.access_token, {
    retryConfig: { retries: 0 },
    rejectRateLimitedCalls: true,
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
  });
  const withAdditionalBlocks: any = {
    ...message,
    blocks: [...message.blocks, ...(options?.blocks ?? [])],
  };

  // Truncate all text with more than 3000 characters
  withAdditionalBlocks.blocks = withAdditionalBlocks.blocks.reduce(
    (previousValue, currentValue) => {
      // Slack has a bug where they accept a message with 3000 characters that includes special characters which should be HTML encoded
      // However in their response they expand special character (i.e. > to &gt;) and count &gt; as 4 characters instead of 1
      // This is a bug they need to fix, but as a temporary workaround, we lower the truncation threshold to 2900
      // https://api.slack.com/reference/surfaces/formatting#escaping
      if (currentValue.text?.text && currentValue.text.text.length > 2900) {
        currentValue.text.text = currentValue.text.text.substring(0, 2900);
        previousValue.push(currentValue);
      } else {
        previousValue.push(currentValue);
      }
      return previousValue;
    },
    []
  );

  try {
    // Can throw ErrorCode.PlatformError for channel not found.
    const channel = await getSlackChannel(botProfile, client);

    if (ts) {
      return await client.chat.update({
        ...withAdditionalBlocks,
        channel,
        ts,
      });
    }

    return await client.chat.postMessage({
      ...withAdditionalBlocks,
      channel,
    });
  } catch (err) {
    if (!err.code) {
      throw err;
    }

    // https://slack.dev/node-slack-sdk/web-api#handle-errors
    switch (err.code) {
      case ErrorCode.HTTPError:
        const { statusCode, ...rest } = err;
        throw new RetryableProviderResponseError(
          `${ErrorCode.HTTPError} with ${statusCode}`,
          rest
        );
      case ErrorCode.PlatformError:
        if (
          retryableErrorCodes.includes(err.data?.error_code) ||
          retryableErrorCodes.includes(err.data?.error)
        ) {
          throw new RetryableProviderResponseError(
            ErrorCode.PlatformError,
            err.data
          );
        }

        throw new ProviderResponseError(ErrorCode.PlatformError, err.data);
      case ErrorCode.RateLimitedError:
        throw new RetryableProviderResponseError(ErrorCode.RateLimitedError);
      case ErrorCode.RequestError:
        throw new RetryableProviderResponseError(
          ErrorCode.RequestError,
          err.original
        );
    }
  }
};
