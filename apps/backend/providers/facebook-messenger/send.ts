import axios from "axios";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (
  { config, fbMessengerConfig, profile },
  template
) => {
  const { pageAccessToken } = config as unknown as {
    pageAccessToken: string;
  };
  const { tag } = fbMessengerConfig;

  if (!pageAccessToken || !pageAccessToken.length) {
    throw new ProviderConfigurationError("No Page Access Token specified.");
  }

  try {
    const res = await axios({
      data: {
        message: {
          text: template.plain,
        },
        messaging_type: "MESSAGE_TAG",
        recipient: {
          id: profile.facebookPSID,
        },
        tag,
      },
      method: "post",
      params: {
        access_token: pageAccessToken,
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Facebook Messenger API request timed out.",
      url: `https://graph.facebook.com/v4.0/me/messages`,
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
