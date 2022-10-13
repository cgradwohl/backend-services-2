import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const accessToken =
    params.override?.config?.accessToken ?? params.config.accessToken;
  if (!accessToken) {
    throw new ProviderConfigurationError("No Access Token specified.");
  }

  const { title = null, plain: body } = template;

  if (!body) {
    throw new ProviderConfigurationError("No body specified");
  }

  try {
    const initialData = {
      title,
      body,
      type: "note",
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const url =
      params.override?.config?.url ?? "https://api.pushbullet.com/v2/pushes";

    const headers = {
      "Access-Token": accessToken,
      "Content-Type": "application/json",
      ...params.override?.headers,
    };

    const res = await axios({
      data,
      headers,
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "PushBullet API request timed out.",
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
