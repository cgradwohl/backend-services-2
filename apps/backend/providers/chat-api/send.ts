import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const instanceId =
    params.override?.config?.instanceId ?? params.config.instanceId;

  if (!instanceId || !instanceId.length) {
    throw new ProviderConfigurationError("No Instance Id specified.");
  }

  const token = params.override?.config?.token ?? params.config.token;
  if (!token || !token.length) {
    throw new ProviderConfigurationError("No Token specified.");
  }

  const url =
    params.override?.config?.url ??
    `https://api.chat-api.com/instance${instanceId}/message?token=${token}`;

  const quotedMsgId = template.quotedMsgId;
  const mentionedPhones = template.mentionedPhones;

  const chatApiData = params.profile.chat_api as any;

  try {
    const initialData = {
      quotedMsgId,
      mentionedPhones,
      phone: chatApiData.phone_number,
      chatId: chatApiData.chat_id,
      body: template.plain,
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
      timeoutErrorMessage: "Chat API request timed out.",
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
