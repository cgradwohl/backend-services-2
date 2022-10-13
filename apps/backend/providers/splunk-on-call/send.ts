import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const apiKey = params.override?.config?.apiKey ?? params.config.apiKey;
  if (!apiKey || !apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const apiId = params.override?.config?.apiId ?? params.config.apiId;
  if (!apiId || !apiId.length) {
    throw new ProviderConfigurationError("No API Id specified.");
  }

  const userName = params.override?.config?.userName ?? params.config.userName;
  if (!userName || !userName.length) {
    throw new ProviderConfigurationError("No username specified.");
  }

  const url =
    params.override?.config?.url ??
    "https://api.victorops.com/api-public/v1/incidents";

  const summary = template.summary;

  if (!summary || !summary.length) {
    throw new ProviderConfigurationError("No summary specified.");
  }

  const splunkData = params.profile.splunk_on_call as any;

  try {
    const initialData = {
      summary: template.summary,
      userName,
      details: template.plain,
      targets: [splunkData.target],
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        Accept: "application/json",
        "X-VO-Api-Id": apiId,
        "X-VO-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Splunk API request timed out.",
      url,
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
