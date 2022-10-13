import PushNotifications, {
  PublishRequestWithApns,
  PublishRequestWithFcm,
  PublishRequestWithWeb,
  PublishResponse,
} from "@pusher/push-notifications-server";
import { PusherBeamsConfig } from "~/types.api";
import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    instanceId: string;
    secretKey: string;
  };

  if (!config.instanceId) {
    throw new ProviderConfigurationError("No instanceId specified.");
  }

  if (!config.secretKey) {
    throw new ProviderConfigurationError("No secretKey specified.");
  }

  const pusherBeamsConfig = (params.profile?.pusherBeams ??
    {}) as PusherBeamsConfig;

  const { interests, mode, userIds } = pusherBeamsConfig;

  if (!mode) {
    throw new ProviderConfigurationError(
      "At least one of `apns`, `fcm` or `web` modes required"
    );
  }

  if (
    (!userIds || userIds.length === 0) &&
    (!interests || interests.length === 0)
  ) {
    throw new ProviderConfigurationError(
      "Either userIds or interests required"
    );
  }

  try {
    const pushNotifications = new PushNotifications({
      instanceId: config.instanceId,
      secretKey: config.secretKey,
    });

    const payload = {
      body: template.body,
      title: template.title,
    };

    const apns: PublishRequestWithApns = mode.includes("apns") && {
      apns: {
        aps: {
          alert: payload,
        },
      },
    };

    const fcm: PublishRequestWithFcm = mode.includes("fcm") && {
      fcm: {
        notification: payload,
      },
    };

    const web: PublishRequestWithWeb = mode.includes("web") && {
      web: {
        notification: payload,
      },
    };

    let response: PublishResponse;

    if (userIds) {
      response = await pushNotifications.publishToUsers(userIds, {
        ...apns,
        ...fcm,
        ...web,
      });
    } else {
      response = await pushNotifications.publishToInterests(interests, {
        ...apns,
        ...fcm,
        ...web,
      });
    }
    return response;
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default send;
