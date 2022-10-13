import {
  Message,
  MessageChannelEmailOverride,
  MessageChannelPushOverride,
  MessageRouting,
} from "~/api/send/types";

export const getProviderOverrides = (
  message: Message
): Record<string, any> | undefined => {
  // NOTE: This I think is a mistake, we are defaulting to an empty object
  //       so that we don't error out, yet we use message.providers which we've
  //       already established that it doesn't exist.
  // NOTE: Asserting that message is not empty
  const overrides = Object.keys(message.providers ?? {}).reduce((acc, key) => {
    if (message!.providers![key].hasOwnProperty("override")) {
      return { ...acc, [key]: message!.providers![key]["override"] };
    }
    return acc;
  }, {});

  return Object.keys(overrides).length ? overrides : undefined;
};

export const getChannelOverrides = (
  message: Message
): MessageChannelEmailOverride | MessageChannelPushOverride | undefined => {
  const channelOverrides = Object.keys(message.channels ?? {}).reduce(
    (acc, key) => {
      if (message!.channels![key].hasOwnProperty("override")) {
        if (message!.channels![key]["override"]["reply_to"]) {
          const { reply_to, ...restOverride } =
            message!.channels![key]["override"];
          return {
            ...acc,
            [key]: {
              ...restOverride,
              // backend processing respects camelCase
              replyTo: reply_to,
            },
          };
        }
        return { ...acc, [key]: message!.channels![key]["override"] };
      }
      return acc;
    },
    {}
  );

  return Object.keys(channelOverrides).length ? channelOverrides : undefined;
};

export const getBrandOverride = (
  message: Message
): MessageChannelEmailOverride["brand"] => {
  if (!message?.channels) {
    return undefined;
  }

  if (!message.channels?.email) {
    return undefined;
  }

  // currently we only support email brand overrides, which is consistent with V1 pipeline
  return message.channels.email?.override?.brand ?? undefined;
};

export const getOverrides = (
  message: Message
):
  | {
      brand?: MessageChannelEmailOverride["brand"];
      channels?: MessageChannelEmailOverride | MessageChannelPushOverride;
      providers?: Record<string, any>;
    }
  | undefined => {
  const channelOverrides = getChannelOverrides(message);
  const providerOverrides = getProviderOverrides(message);
  const brandOverride = getBrandOverride(message);

  const overrides = {
    ...(channelOverrides ? { channels: channelOverrides } : {}),
    ...(brandOverride ? { brand: brandOverride } : {}),
    ...(providerOverrides ? { providers: providerOverrides } : {}),
  };

  return Object.keys(overrides ?? {}).length ? overrides : undefined;
};
