import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const { accessToken, from } = params.config as unknown as {
    accessToken: string;
    from: string;
  };

  if (!accessToken || !accessToken.length) {
    throw new ProviderConfigurationError("No Access Token specified.");
  }

  if (!from || !from.length) {
    throw new ProviderConfigurationError("No From User ID specified.");
  }

  const { to } = params.profile.intercom as unknown as {
    to: {
      id: string;
      type?: string;
    };
  };

  try {
    const initialData = {
      body: template.plain,
      from: {
        id: from,
        type: "admin",
      },
      message_type: "inapp",
      to: {
        id: to.id,
        type: to.type || "user",
      },
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Intercom API request timed out.",
      url: `https://api.intercom.io/messages`,
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
