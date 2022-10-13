import axios from "axios";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const apiKey = params.override?.config?.apiKey ?? params.config.apiKey;
  if (!apiKey) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const from = params.override?.config?.from ?? params.config.from;
  if (!from) {
    throw new ProviderConfigurationError("No Originating Number specified.");
  }

  const url =
    params.override?.config?.url ?? "https://api.telnyx.com/v2/messages";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...params.override?.headers,
  };

  const data = {
    from,
    text: template.plain,
    to: params.profile.phone_number,
    ...params.override?.body,
  };

  try {
    const res = await axios({
      data,
      headers,
      method: "POST",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Telnyx API request timed out.",
      url,
    });
    return res.data;
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
