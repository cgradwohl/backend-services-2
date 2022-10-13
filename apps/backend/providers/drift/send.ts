import axios from "axios";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const accessToken =
    params.override?.config?.accessToken ?? params.config.accessToken;

  if (!accessToken) {
    throw new ProviderConfigurationError("No Access Token specified.");
  }

  const url =
    params.override?.config?.url ?? "https://driftapi.com/conversations/new";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...params.override?.headers,
  };

  const data = {
    email: params.profile.email,
    message: {
      body: template.plain,
      attributes: {
        integrationSource: "Courier",
      },
    },
    ...params.override?.body,
  };

  try {
    const res = await axios({
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Drift API request timed out.",
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
