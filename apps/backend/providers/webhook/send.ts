import axios, { Method } from "axios";

import { encode as base64Encode } from "~/lib/base64";

import { handleSendError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

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

const getDynamicRequestParams = (
  profile: any,
  payload
): IWebhookRequestParams => {
  const profileMethod =
    profile.method && typeof profile.method === "string"
      ? profile.method.toLowerCase()
      : "post";
  const method = allowedMethods.find((m) => m === profileMethod) || "post";
  const headers =
    profile.headers && typeof profile.headers === "object"
      ? profile.headers
      : {};

  if (profile.authentication && typeof profile.authentication === "object") {
    const { mode, password, token, username } = profile.authentication;
    switch (mode) {
      case "basic":
        headers.Authorization = `Basic ${base64Encode(
          String(username ?? "")
        )}:${base64Encode(String(password ?? ""))}`;
        break;
      case "bearer":
        headers.Authorization = `Bearer ${token}`;
        break;
    }
  }

  return {
    data: payload,
    headers,
    method,
    url: profile.url,
  };
};

const send: DeliveryHandler = async (params, { payload }) => {
  const { config, override = {}, profile = {} } = params;
  const { getConfigFromProfile = false } = config as any;
  const request = getConfigFromProfile
    ? getDynamicRequestParams(profile.webhook, payload)
    : getStaticRequestParams(config, payload);

  try {
    if (override.body && typeof override.body === "object") {
      request.data = jsonMerger.mergeObjects([request.data, override.body]);
    }

    if (override.url && typeof override.url === "string") {
      request.url = override.url;
    }

    if (override.headers && typeof override.headers === "object") {
      request.headers = jsonMerger.mergeObjects([
        request.headers,
        override.headers,
      ]);
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
      timeoutErrorMessage: "Webhook API request timed out.",
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
