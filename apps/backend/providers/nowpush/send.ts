import axios from "axios";
import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

type NowPushDevicetype = "api" | "browser" | "mobile";
type NowPushMessageType = "nowpush_note" | "nowpush_img" | "nowpush_link";

const send: DeliveryHandler = async (params, templates) => {
  const apiKey =
    (params.profile?.nowpush as any)?.apiKey ?? params.config.apiKey;

  if (!apiKey) {
    throw new ProviderConfigurationError("No API key provided");
  }

  const deviceType: NowPushDevicetype =
    (params.profile?.nowpush as any)?.device_type ?? "api";
  const messageType: NowPushMessageType =
    (params.profile?.nowpush as any)?.message_type ?? "nowpush_note";

  const note = templates.plain;
  const url = (params.profile?.nowpush as any)?.url ?? "";

  const data = {
    device_type: deviceType,
    message_type: messageType,
    note,
    url,
  };

  try {
    const res = await axios({
      data,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "NowPush API request timed out.",
      url: "https://www.api.nowpush.app/v3/sendMessage",
    });
    return res.data;
  } catch (ex) {
    throw new ProviderResponseError(ex);
  }
};

export default send;
