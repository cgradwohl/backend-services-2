import {
  MessageChannels,
  MessageProviders,
  RequestV2,
  TemplateMessage,
} from "~/api/send/types";
import { IBrand } from "~/types.api";
import { ApiSendRequest } from "~/types.public";
import makeError from "make-error";
import { translationCountMetric } from "~/lib/courier-emf/logger-metrics-utils";

export const RequestTranslationError = makeError("RequestTranslationError");

export const translateChannelOverrides: (
  request: ApiSendRequest
) => MessageChannels = (request: ApiSendRequest) => {
  if (!request?.override?.channel) {
    return undefined;
  }

  if (
    !request?.override?.channel?.email &&
    !request?.override?.channel?.push &&
    !request?.override?.webhook
  ) {
    return undefined;
  }

  const channelOverrides = Object.keys(request.override.channel).reduce(
    (override, channel) => {
      return {
        [channel]: {
          override: Object.keys(request?.override?.channel[channel]).reduce(
            (channelOverride, curr) => {
              const value = request.override.channel[channel][curr];

              if (curr === "replyTo") {
                return { reply_to: value, ...channelOverride };
              }

              if (curr === "clickAction") {
                return { click_action: value, ...channelOverride };
              }

              return { [curr]: value, ...channelOverride };
            },
            {}
          ),
        },
        ...override,
      };
    },
    {}
  );

  return Object.keys(channelOverrides ?? {}).length
    ? channelOverrides
    : undefined;
};

export const translateProviderOverrides: (
  request: ApiSendRequest
) => MessageProviders = (request: ApiSendRequest) => {
  if (!request?.override) {
    return undefined;
  }

  const OverrideKeys = new Set(["brand", "channel", "webhook"]);

  const providerOverrides = Object.keys(request.override).reduce(
    (acc, property) => {
      if (!OverrideKeys.has(property)) {
        return {
          [property]: {
            override: request.override[property],
          },
          ...acc,
        };
      }
      return acc;
    },
    {}
  );

  return Object.keys(providerOverrides ?? {}).length
    ? providerOverrides
    : undefined;
};

export const getBrandOverrides = (request: ApiSendRequest) => {
  if (!request?.override) {
    return undefined;
  }

  if (!request?.override?.brand) {
    return undefined;
  }

  return request?.override?.brand;
};

export const extendChannelsWithBrandOverrides = (
  channels: Record<string, any>,
  brandOverride: Partial<IBrand>
) => {
  if (!brandOverride) {
    return Object.keys(channels ?? {}).length ? channels : undefined;
  }

  const channelsOrBrandExists = channels?.email || brandOverride;

  const extendedChannels = {
    ...channels,
    ...(channelsOrBrandExists && {
      email: {
        ...channels?.email,
        override: {
          ...channels?.email?.override,
          brand: brandOverride,
        },
      },
    }),
  };

  return Object.keys(extendedChannels).length ? extendedChannels : undefined;
};

export const translateRequest = async (params: {
  request: ApiSendRequest;
  tenantId: string;
  traceId: string;
}): Promise<RequestV2> => {
  const { request, tenantId, traceId } = params;
  try {
    const {
      brand,
      data,
      event,
      preferences,
      profile,
      recipient: user_id,
    } = request;
    const channels = extendChannelsWithBrandOverrides(
      translateChannelOverrides(request),
      getBrandOverrides(request)
    );
    const providers = translateProviderOverrides(request);

    const message = {} as TemplateMessage;

    if (brand) {
      message.brand_id = brand;
    }

    if (channels) {
      message.channels = channels;
    }

    if (data) {
      message.data = data;
    }

    if (providers) {
      message.providers = providers;
    }

    message.template = event;

    message.to = {
      ...profile,
      user_id,
    };

    if (preferences) {
      message.to.preferences = preferences;
    }

    await translationCountMetric({
      properties: {
        traceId,
      },
      tenantId,
    });

    return {
      message,
    };
  } catch (error) {
    throw new RequestTranslationError(error);
  }
};
