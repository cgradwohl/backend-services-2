import axios from "axios";
import { getTokensForProvider, updateTokenStatuses } from "~/lib/token-storage";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    appId: string;
    apiKey: string;
  };

  if (!config.appId || !config.appId.length) {
    throw new ProviderConfigurationError("No App ID specified.");
  }
  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const { profile } = params;
  const { tokens, isManaged: isManagedTokens } = await getTokensForProvider({
    params,
    providerKey: "onesignal",
    profileTokenExtractor: (profile) =>
      profile.oneSignalPlayerID
        ? [profile.oneSignalPlayerID as string]
        : undefined,
  });

  try {
    const client = axios.create({
      baseURL: "https://onesignal.com/api/v1",
      headers: {
        Authorization: `Basic ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "OneSignal Push API request timed out.",
    });

    let body: {
      app_id: string;
      contents: {
        en: string;
      };
      headings?: {
        en: string;
      };
      include_player_ids?: string[];
      include_external_user_ids?: string[];
    } = {
      app_id: config.appId,
      contents: { en: templates.body },
      ...(templates.title && { headings: { en: templates.title } }),
    };

    if (tokens.length) {
      body.include_player_ids = tokens;
    }

    if (profile.oneSignalExternalUserId) {
      body.include_external_user_ids = [
        profile.oneSignalExternalUserId as string,
      ];
    }

    if (params.override && params.override.body) {
      body = jsonMerger.mergeObjects([body, params.override.body]);
    }

    const res = await client.post("/notifications", body);

    if (isManagedTokens) {
      await updateTokenStatuses({
        results: tokens.map((token) => ({
          token,
          status: res.data.errors?.invalid_player_ids?.includes(token)
            ? "failed"
            : "active",
        })),
        tenantId: params.tenantId,
      }).catch((e) => console.warn(e));
    }

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
