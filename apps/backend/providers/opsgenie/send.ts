import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const apiKey = params.override?.config?.apiKey ?? params.config.apiKey;
  if (!apiKey) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const { message, plain: description = null } = template;

  if (!message) {
    throw new ProviderConfigurationError("No message specified");
  }

  try {
    const initialData = {
      description,
      message,
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const url =
      params.override?.config?.url ?? "https://api.opsgenie.com/v2/alerts";

    const headers = {
      Authorization: `GenieKey ${apiKey}`,
      "Content-Type": "application/json",
      ...params.override?.headers,
    };

    const res = await axios({
      data,
      headers,
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "OpsGenie API request timed out.",
      url,
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
