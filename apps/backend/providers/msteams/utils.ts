import axios from "axios";
import {
  handleSendError as handleError,
  ProviderResponseError,
} from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { encodeUrlData } from "../send-helpers";

export const getAccessToken = async ({
  appId,
  appPassword,
}: {
  appId: string;
  appPassword: string;
}): Promise<string> => {
  let token: string;

  const authUrl =
    "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token";
  const authData = encodeUrlData({
    grant_type: "client_credentials",
    client_id: appId,
    client_secret: appPassword,
    scope: "https://api.botframework.com/.default",
  });

  try {
    token = (
      await axios.post(authUrl, authData, {
        headers: {
          Host: "login.microsoftonline.com",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
    ).data.access_token;
  } catch (err) {
    handleError(err);
  }

  if (!token) {
    throw new ProviderResponseError(
      "Could not retrieve Auth Token with configured App ID and App Password"
    );
  }

  return token;
};

export const getUserConversation = async ({
  serviceUrl,
  msg,
  appId,
  userId,
  tenantId,
  token,
}: {
  serviceUrl: string;
  msg: object;
  appId: string;
  userId: string;
  tenantId: string;
  token: string;
}): Promise<string> => {
  const userUrl = `${serviceUrl}/v3/conversations`;

  const userConvMsg = {
    activity: msg,
    bot: {
      id: appId,
    },
    members: [{ id: userId }],
    tenantId: tenantId,
  };

  const response = await invokeMSTeams({
    url: userUrl,
    msg: userConvMsg,
    token,
  });

  if (!response.data.id) {
    throw new ProviderResponseError("Could not retrieve User Conversation ID");
  }

  return response.data.id;
};

export const invokeMSTeams = async ({
  url,
  msg,
  token,
}: {
  url: string;
  msg: object;
  token: string;
}) => {
  try {
    const response = await axios.post(url, msg, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Microsoft Teams API request timed out.",
    });

    return response;
  } catch (err) {
    handleError(err);
  }
};
