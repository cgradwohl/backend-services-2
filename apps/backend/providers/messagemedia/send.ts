import axios from "axios";
import {
  handleSendError,
  ProviderConfigurationError,
} from "~/providers/errors";
import { hmacHeaderUtil } from "~/providers/messagemedia/hmac-header-utils";
import { DeliveryHandler } from "~/providers/types";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    apiKey: string;
    apiSecret: string;
    isHmacEnabled: boolean;
  };

  const apiKey = params.override?.config?.apiKey ?? config.apiKey;
  const apiSecret = params.override?.config?.apiSecret ?? config.apiSecret;
  const isHmacEnabled =
    params.override?.config?.isHmacEnabled ?? config.isHmacEnabled;

  if (!apiKey) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  if (!apiSecret) {
    throw new ProviderConfigurationError("No API Secret specified.");
  }

  const url =
    params.override?.config?.url ?? "https://api.messagemedia.com/v1/messages";

  const payload = {
    messages: [
      {
        // first two the most basic things we need to send direct_message
        content: template.plain,
        destination_number: params.profile.phone_number as string,
        // overrides can be anything from the https://messagemedia.github.io/documentation/#operation/SendMessages
        ...(params?.override?.body ?? {}),
      },
    ],
  };

  const headers = {
    ...(isHmacEnabled
      ? hmacHeaderUtil(apiKey, apiSecret).getHmacHeaders(
          "/v1/messages",
          JSON.stringify(payload)
        )
      : {
          Authorization: `Basic ${Buffer.from(
            `${apiKey}:${apiSecret}`,
            "utf8"
          ).toString("base64")}`,
        }),
    ...params.override?.headers,
  };

  try {
    // https://messagemedia.github.io/documentation/#operation/SendMessages
    const response = await axios({
      data: payload,
      headers,
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "MessageMedia API request timed out.",
      url,
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
