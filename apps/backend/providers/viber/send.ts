import axios from "axios";
import { handleSendError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const config = {
    token: (params.override?.config?.token ?? params.config.token) as string,
    name: (params.override?.config?.name ?? params.config.name) as string,
    apiURL: (params.override?.config?.apiURL ??
      "https://chatapi.viber.com/pa/send_message") as string,
  };

  const data = {
    receiver: (params.profile.viber as any).receiver,
    type: "text",
    min_api_version: 1,
    sender: { name: config.name },
    text: template.plain,
    // Overrides payload sent to https://developers.viber.com/docs/api/rest-bot-api/#send-message
    ...(params?.override?.body ?? {}),
  };

  const headers = {
    "Content-Type": "application/json",
    "X-Viber-Auth-Token": config.token,
    ...(params.override?.config?.headers ?? {}),
  };

  try {
    const response = await axios({
      headers,
      data,
      method: "POST",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Viber API request timed out.",
      url: config.apiURL,
    });

    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    handleSendError(error);
  }
};

export default send;
