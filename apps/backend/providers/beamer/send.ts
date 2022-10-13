import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const { apiKey } = params.config as unknown as {
    apiKey: string;
  };

  if (!apiKey || !apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  if (!template.category?.length) {
    throw new ProviderConfigurationError("No category provided.");
  }

  if (!template.title?.length) {
    throw new ProviderConfigurationError("No title provided.");
  }

  const {
    filter,
    filterUserId,
    filterUrl,
    sendPushNotification,
    publish = true,
  } = (params.profile?.beamer || ({} as unknown)) as {
    filter: string;
    filterUserId: string;
    filterUrl: string;
    sendPushNotification: boolean;
    publish: boolean;
  };

  try {
    const initialData = {
      title: [template.title],
      content: [template.plain],
      category: template.category,
      filter,
      filterUrl,
      filterUserId,
      sendPushNotification,
      publish,
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        Accept: "application/json",
        "Beamer-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Beamer API request timed out.",
      url: `https://api.getbeamer.com/v0/posts`,
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
