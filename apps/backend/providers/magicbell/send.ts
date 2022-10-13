import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    apiSecret: string;
    apiKey: string;
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }
  if (!config.apiSecret || !config.apiSecret.length) {
    throw new ProviderConfigurationError("No API Secret specified.");
  }

  try {
    const initialData = {
      notification: {
        title: template.title,
        action_url: template.clickAction,
        recipients: [
          {
            email: params.profile.email,
            external_id: (params.profile.magicbell as any)?.external_id,
          },
        ],
        content: template.body,
      },
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        "Content-Type": "application/json",
        "X-MAGICBELL-API-KEY": config.apiKey,
        "X-MAGICBELL-API-SECRET": config.apiSecret,
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Magicbell API request timed out.",
      url: `https://api.magicbell.io/notifications`,
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
