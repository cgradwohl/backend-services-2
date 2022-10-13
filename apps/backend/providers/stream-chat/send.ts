import axios from "axios";
import { sign } from "jsonwebtoken";
import {
  handleSendError,
  ProviderConfigurationError,
} from "~/providers/errors";
import { DeliveryHandler } from "~/providers/types";
import { StreamChatConfig } from "~/types.api";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    apiKey: string;
    apiSecret: string;
    senderId: string;
  };

  const apiKey = params.override?.config?.apiKey ?? config.apiKey;
  const apiSecret = params.override?.config?.apiSecret ?? config.apiSecret;
  const senderId = params.override?.config?.senderId ?? config.senderId;

  if (!apiKey) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  if (!apiSecret) {
    throw new ProviderConfigurationError("No API Secret specified.");
  }

  if (!senderId) {
    throw new ProviderConfigurationError("No Sender ID specified.");
  }

  const baseUrl =
    params.override?.config?.baseUrl ??
    "https://chat-us-east-1.stream-io-api.com";

  const streamChatConfig = (params.profile?.streamChat ??
    {}) as StreamChatConfig;

  const { channelId, channelType, messageId } = streamChatConfig;

  if (!messageId && (!channelId || !channelType)) {
    throw new ProviderConfigurationError(
      "Either messageId or channelId and channelType required"
    );
  }

  const headers = {
    Authorization: sign({}, apiSecret),
    "Content-Type": "application/json",
    "stream-auth-type": "jwt",
    ...(params.override?.config?.headers ?? {}),
  };

  const payload = {
    message: {
      ...(messageId && { id: messageId }),
      text: template.plain,
      user: {
        id: senderId,
      },
      // overrides can be anything from the https://getstream.io/chat/docs/other-rest/send_message/
      ...(params?.override?.body ?? {}),
    },
  };

  const url =
    channelId && channelType
      ? `${baseUrl}/channels/${channelType}/${channelId}/message`
      : `${baseUrl}/messages/${messageId}`;

  try {
    const response = await axios({
      data: payload,
      headers,
      method: "post",
      params: {
        api_key: apiKey,
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Stream Chat API request timed out.",
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
