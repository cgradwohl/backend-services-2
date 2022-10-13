// we prob want to use an HTTP call to apple
import apn, {
  NotificationAlertOptions,
  ProviderOptions,
} from "@parse/node-apn";
import {
  getTokensForProvider,
  standardProfileTokenExtractor,
  updateTokenStatuses,
} from "~/lib/token-storage";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";
import { tokenStatusMapper } from "./token-helpers";

const send: DeliveryHandler = async (params, template) => {
  const { tokens, isManaged: isManagedToken } = await getTokensForProvider({
    params,
    providerKey: "apn",
    profileTokenExtractor: (profile) =>
      standardProfileTokenExtractor("apn", profile),
    maxTokenAgeMs: 1000 * 60 * 60 * 24 * 60, // 60 days
  });

  const key = params.override?.config?.key ?? params.config.key;
  const keyId = params.override?.config?.keyId ?? params.config.keyId;
  const teamId = params.override?.config?.teamId ?? params.config.teamId;

  if (!tokens.length) {
    throw new ProviderConfigurationError("No device token specified.");
  }

  if (!key) {
    throw new ProviderConfigurationError("No key specified.");
  }

  if (!keyId) {
    throw new ProviderConfigurationError("No `key_id` specified.");
  }

  if (!teamId) {
    throw new ProviderConfigurationError("No `team_id` specified.");
  }

  const options: ProviderOptions = {
    // provide overrides for production flag. Dev key from integration don't work if we set production to true
    production:
      params.override?.config?.isProduction ??
      params.config.isProduction ??
      true,
    requestTimeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    token: {
      key,
      keyId,
      teamId,
    },
  };

  const notification = new apn.Notification();
  const payload: string | { [key: string]: any } =
    params.override?.body?.payload ?? {};

  if (params?.channelTrackingUrl && typeof payload !== "string") {
    payload.trackingUrl = params.channelTrackingUrl;
  }
  const expiry =
    params.override?.body?.expiry ?? Math.floor(Date.now() / 1000) + 3600;
  const sound = params.override?.body?.sound ?? "ping.aiff";
  const alertOverrides: NotificationAlertOptions = params.override?.body?.alert;

  const alert: NotificationAlertOptions = {
    body: alertOverrides?.body ?? template.body,
    subtitle: alertOverrides?.subtitle,
    title: alertOverrides?.title ?? template.title,
  };
  if (alertOverrides && typeof alertOverrides === "object") {
    if ("launch-image" in alertOverrides) {
      alert["launch-image"] = alertOverrides["launch-image"];
    }
    if ("loc-args" in alertOverrides) {
      alert["loc-args"] = alertOverrides["loc-args"];
    }
    if ("loc-key" in alertOverrides) {
      alert["loc-key"] = alertOverrides["loc-key"];
    }
    if ("title-loc-args" in alertOverrides) {
      alert["title-loc-args"] = alertOverrides["title-loc-args"];
    }
    if ("title-loc-key" in alertOverrides) {
      alert["title-loc-key"] = alertOverrides["title-loc-key"];
    }
  }

  const topic =
    params.override?.body?.topic ?? params.config?.topic ?? template.topic;

  notification.alert = alert;
  notification.expiry = expiry;
  notification.payload = payload;
  notification.sound = sound;
  notification.topic = topic;
  // https://trycourier.slack.com/archives/C01UALXT6CQ/p1651865702690179?thread_ts=1650555671.237779&cid=C01UALXT6CQ
  if (params.override?.body?.badge) {
    notification.badge = params.override?.body?.badge;
  }
  if (params.override?.body?.["content-available"]) {
    notification.contentAvailable =
      params.override.body["content-available"] > 0 ? true : false;
  }

  if (params.override?.body?.["apns-priority"]) {
    notification.priority = params.override.body["apns-priority"];
  }

  if (params.override?.body?.["apns-collapse-id"]) {
    notification.collapseId = params.override.body["apns-collapse-id"];
  }

  if (params.override?.body?.threadId) {
    notification.threadId = params.override?.body?.threadId;
  }

  if (params.override?.body?.category) {
    notification.aps.category = params.override?.body?.category;
  }

  if (params.override?.body?.aps) {
    notification.aps = params.override?.body?.aps;
  }

  if (params.override?.body?.["mutable-content"]) {
    notification.mutableContent =
      params.override.body["mutable-content"] > 0 ? true : false;
  }

  let apnProvider;

  try {
    apnProvider = new apn.Provider(options);
  } catch (error) {
    throw new ProviderConfigurationError(error.toString());
  }

  try {
    const response = await apnProvider.send(notification, tokens);

    if (isManagedToken) {
      await updateTokenStatuses({
        results: tokenStatusMapper(tokens, response),
        tenantId: params.tenantId,
      }).catch((e) => console.warn(e));
    }

    if (response?.failed.length >= tokens.length) {
      throw new Error(JSON.stringify(response.failed));
    }

    return {
      providerRequest: {
        notification,
        tokens,
      },
      providerResponse: response,
    };
  } catch (err) {
    handleSendError(err);
  } finally {
    apnProvider.shutdown();
  }
};

export default send;
