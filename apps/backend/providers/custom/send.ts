import axios, { Method } from "axios";

import extend from "deep-extend";
import { handleSendError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const allowedMethods: Method[] = ["post", "put"];

interface IWebhookRequestParams {
  method: Method;
  headers: { [header: string]: string };
  url: string;
  data: any;
}

const getStaticRequestParams = (
  config: any,
  payload
): IWebhookRequestParams => {
  const { auth } = config;
  const headers = auth && auth !== "none" ? { Authorization: auth } : {};

  return {
    data: payload,
    headers,
    method: "post",
    url: config.url,
  };
};

const send: DeliveryHandler = async (params, content) => {
  const { config, override = {} } = params;
  const request = getStaticRequestParams(config, {
    type: "push",
    data: {
      messageId: params.messageId,
      channel: {
        id: params.channel?.id,
        label: params.channel?.label,
      },
      content,
    },
  });

  try {
    if (override.body && typeof override.body === "object") {
      request.data = extend({}, request.data, override.body);
    }

    if (override.url && typeof override.url === "string") {
      request.url = override.url;
    }

    if (override.headers && typeof override.headers === "object") {
      request.headers = extend({}, request.headers, override.headers);
    }

    if (override.method && typeof override.method === "string") {
      const overrideMethod = override.method.toLowerCase();
      const safeMethod = allowedMethods.find((m) => m === overrideMethod);
      if (safeMethod) {
        request.method = safeMethod;
      }
    }

    const res = await axios({
      ...request,
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Custom Provider API request timed out.",
    });

    return {
      data: res.data,
      headers: res.headers,
      status: res.status,
      statusText: res.statusText,
    };
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
