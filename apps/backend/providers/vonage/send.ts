import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import {
  ProviderConfigurationError,
  handleSendError,
  ProviderResponseError,
} from "../errors";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const apiKey = params.override?.config?.apiKey ?? params.config.apiKey;
  if (!apiKey || !apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const apiSecret =
    params.override?.config?.apiSecret ?? params.config.apiSecret;
  if (!apiSecret || !apiSecret.length) {
    throw new ProviderConfigurationError("No API Secret specified.");
  }

  const fromNumber =
    params.override?.config?.fromNumber ?? params.config.fromNumber;
  if (!fromNumber || !fromNumber.length) {
    throw new ProviderConfigurationError("No From Number specified.");
  }

  const url = params.override?.config?.url ?? "https://rest.nexmo.com/sms/json";

  const { profile } = params;

  try {
    const initialData = {
      text: templates.plain,
      to: profile.phone_number,
      from: fromNumber,
      api_key: apiKey,
      api_secret: apiSecret,
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Vonage API request timed out.",
      url,
    });

    const messageStatus = res?.data?.messages[0]?.status;
    //vonage error codes https://developer.vonage.com/messaging/sms/guides/troubleshooting-sms
    if (messageStatus !== "0") {
      throw Error(res?.data?.messages[0]?.["error-text"]);
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
