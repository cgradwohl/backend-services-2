import axios from "axios";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    apiToken: string;
    servicePlanId: string;
    fromNumber: string;
  };

  if (!config.apiToken) {
    throw new ProviderConfigurationError("No API Token specified.");
  }

  if (!config.servicePlanId) {
    throw new ProviderConfigurationError("No Service Plan ID specified.");
  }

  if (!config.fromNumber) {
    throw new ProviderConfigurationError("No From Number specified.");
  }

  try {
    const { profile } = params;

    const messageData = {
      from: config.fromNumber,
      to: [profile.phone_number],
      body: templates.plain,
    };

    const res = await axios({
      data: JSON.stringify(messageData),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Sinch API request timed out.",
      url: `https://us.sms.api.sinch.com/xms/v1/${config.servicePlanId}/batches`,
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
