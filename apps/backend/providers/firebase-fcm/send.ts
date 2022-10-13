import axios from "axios";
import { google } from "googleapis";
import {
  getTokensForProvider,
  TokenUsageResult,
  updateTokenStatuses,
} from "~/lib/token-storage";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler, DeliveryHandlerParams } from "../types";

// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

const MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

type FireBaseResult = TokenUsageResult & { data?: any };

const send: DeliveryHandler = async (params, template) => {
  const { tokens, isManaged: tokensAreManaged } = await getTokensForProvider({
    params,
    providerKey: "firebase-fcm",
    profileTokenExtractor: (profile) =>
      profile.firebaseToken ? [profile.firebaseToken as string] : undefined,
    maxTokenAgeMs: 1000 * 60 * 60 * 24 * 60, // 60 days
  });

  if (!tokens.length) {
    throw new ProviderConfigurationError("No device token specified.");
  }

  // Send to each token
  const results: FireBaseResult[] = [];
  const errors: Error[] = [];
  await Promise.all(
    tokens.map((token) =>
      sendMessage({
        params,
        registrationToken: token,
        template,
      })
        .then((data) => results.push({ token, status: "active", data }))
        .catch((err) => {
          if (isTokenError(err)) {
            const reason = err.response?.data?.error?.status;
            results.push({ token, status: "failed", reason });
          }

          errors.push(err);
        })
    )
  );

  // Update token usage status if courier manages them
  if (tokensAreManaged) {
    await updateTokenStatuses({ tenantId: params.tenantId, results });
  }

  // If every send failed handle the first one (for now).
  if (errors.length === tokens.length) {
    handleFirebaseError(errors[0]);
  }

  return results.find((r) => r.status === "active")?.data;
};

const sendMessage = async ({
  params,
  registrationToken,
  template,
}: {
  params: DeliveryHandlerParams;
  registrationToken: string;
  template: {
    [key: string]: any;
  };
}) => {
  const { config, override } = params;

  const serviceAccountJSON =
    override?.config?.serviceAccountJSON ?? config.serviceAccountJSON;

  if (!serviceAccountJSON) {
    throw new ProviderConfigurationError("No Service Account JSON specified.");
  }

  const serviceAccountJson = (
    typeof serviceAccountJSON === "string"
      ? JSON.parse(serviceAccountJSON)
      : serviceAccountJSON
  ) as IServiceAccountJson;

  if (!serviceAccountJson.project_id) {
    throw new ProviderConfigurationError(
      "project_id required in Service Account JSON"
    );
  }

  const accessToken = await getAccessToken(serviceAccountJson);

  const request: any = {
    message: {
      notification: {
        body: template.body,
        title: template.title,
        image: template.image,
      },
      token: registrationToken,
      data: {
        clickAction: template.clickAction,
      },
    },
  };

  if (params?.channelTrackingUrl) {
    request.message.data.trackingUrl = params.channelTrackingUrl;
  }

  if (override?.body) {
    request.message = jsonMerger.mergeObjects([request.message, override.body]);
  }

  const res = await axios({
    data: request,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "post",
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    timeoutErrorMessage: "Firebase FCM API request timed out.",
    url: `https://fcm.googleapis.com/v1/projects/${serviceAccountJson.project_id}/messages:send`,
  });

  return res.data;
};

interface IServiceAccountJson {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

const getAccessToken = async (credentials: IServiceAccountJson) => {
  try {
    const auth = new google.auth.GoogleAuth({
      clientOptions: {},
      credentials,
      scopes: [MESSAGING_SCOPE],
    });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    return token;
  } catch (err) {
    throw new ProviderConfigurationError("Invalid Service Account JSON");
  }
};

// https://firebase.google.com/docs/cloud-messaging/manage-tokens
const isTokenError = (err: any) => {
  const reason = err.response?.data?.error?.status;
  return ["INVALID_ARGUMENT", "UNREGISTERED"].includes(reason);
};

const handleFirebaseError = (err: any) => {
  if (err instanceof ProviderConfigurationError) {
    throw err;
  }

  return handleSendError(err);
};

export default send;
