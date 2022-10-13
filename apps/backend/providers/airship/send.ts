import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    baseUrl: {
      value: string;
    };
    authToken: string;
  };

  if (!config.baseUrl) {
    throw new ProviderConfigurationError("No Base URL specified.");
  }

  if (!config.authToken) {
    throw new ProviderConfigurationError("No Auth Token specified.");
  }

  const profile = params.profile.airship as unknown as {
    audience: any;
    device_types: [string];
  };

  // This implements a single request,
  // Airship offers support up to 100 at a time in a single push payload
  // Defaulting the device_types to iOS/Android
  const request: {
    audience: string;
    device_types: string[];
    global_attributes?: {
      [key: string]: any;
    }; // tslint:disable-line: no-any
    notification: {
      alert: string;
      android?: {
        title: string;
      };
      ios?: {
        title: string;
      };
      web?: {
        title: string;
      };
    };
  } = {
    audience: profile.audience,
    device_types: profile.device_types || ["ios", "android", "web"],
    notification: {
      alert: template.body,
    },
  };

  if (params.channelTrackingUrl) {
    request.global_attributes = {
      trackingUrl: params.channelTrackingUrl,
    };
  }

  if (template.title) {
    request.notification = {
      ...request.notification,
      android: {
        title: template.title,
      },
      ios: {
        title: template.title,
      },
      web: {
        title: template.title,
      },
    };
  }

  const baseUrl = config.baseUrl.value || "https://go.urbanairship.com";

  const data =
    params.override && params.override.body
      ? jsonMerger.mergeObjects([request, params.override.body])
      : request;

  const extData =
    params.override && params.override.headers
      ? jsonMerger.mergeObjects([request, params.override.headers])
      : request;

  // Expose an override for "Authorization": "Basic MY_ENCODED_AUTH_TOKEN"
  // this gives the customer access points to multiple applications over a single configuration
  const authorizationToken =
    extData.Authorization || `Bearer ${config.authToken}`;

  try {
    const res = await axios({
      data,
      headers: {
        Accept: "application/vnd.urbanairship+json; version=3;",
        Authorization: authorizationToken,
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Airship API request timed out.",
      url: `${baseUrl}/api/push`,
    });

    return res.data;
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
