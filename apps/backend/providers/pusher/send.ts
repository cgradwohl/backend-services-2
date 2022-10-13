import Pusher from "pusher";

import { ApiSendRequestOverrideChannel } from "~/types.public";
import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    appId: string;
    key: string;
    secret: string;
    cluster: string;
    useTLS: boolean;
  };

  if (!config.appId) {
    throw new ProviderConfigurationError("No appId specified.");
  }

  if (!config.key) {
    throw new ProviderConfigurationError("No key specified.");
  }

  if (!config.secret) {
    throw new ProviderConfigurationError("No secret specified.");
  }

  if (!config.cluster) {
    throw new ProviderConfigurationError("No cluster specified.");
  }

  try {
    const pusher = new Pusher({
      cluster: "us2",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      useTLS: true,
      ...config,
    });

    const { channel } = params?.profile?.pusher as {
      channel: string;
    };

    // we're a webhook
    // taxonomy pusher:web:pusher
    if (templates.payload) {
      return await pusher.trigger(channel, params.eventId, {
        ...templates.payload,
        ...(params?.channelTrackingUrl && {
          trackingUrl: params?.channelTrackingUrl,
        }),
      });
    }

    // we used the designer
    // taxonomy pusher:web:*
    const channelOverrides =
      params?.channelOverride as ApiSendRequestOverrideChannel["channel"]["push"];
    if (channelOverrides?.data) {
      templates.data = {
        ...channelOverrides.data,
      };
    }

    const pusherPayload = {
      ...templates,
    };
    if (params?.channelTrackingUrl) {
      pusherPayload.trackingUrl = params.channelTrackingUrl;
    }

    const resp = await pusher.trigger(channel, params.eventId, pusherPayload);
    return resp;
  } catch (ex) {
    throw new ProviderResponseError(ex);
  }
};

export default send;
