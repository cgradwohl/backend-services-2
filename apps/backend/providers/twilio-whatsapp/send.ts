import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

import { ProviderConfigurationError } from "../errors";
import { DeliveryHandler } from "../types";
import handleError from "../twilio/error-handler";
import { encodeUrlData } from "../send-helpers";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    accountSid: string;
    authToken: string;
    from: string;
  };

  if (!config.accountSid || !config.accountSid.length) {
    throw new ProviderConfigurationError("No Account SID specified.");
  } else if (!config.authToken || !config.authToken.length) {
    throw new ProviderConfigurationError("No Auth Token specified.");
  } else if (!config.from || !config.from.length) {
    throw new ProviderConfigurationError("No From number specified.");
  }

  const { override, profile } = params;
  const accountSid =
    override?.config?.accountSid ??
    override?.config?.AccountSid ??
    config.accountSid;
  const authToken =
    override?.config?.authToken ??
    override?.config?.AuthToken ??
    config.authToken;

  // Backwards compatability for channels configured with From numbers including 'whatsapp:' prefix
  config.from = config.from.replace(/[^+\d]/g, "");

  let body: any = {
    Body: templates.plain,
    From: `whatsapp:${
      override?.config?.from ?? override?.config?.From ?? config.from
    }`,
    To: `whatsapp:${profile.phone_number as string}`,
  };

  if (override?.body) {
    /**
     * Backwards compatability for users following docs and mistakenly
     * using lowerCamelCase rather than UpperCamelCase for override properties
     */
    override.body = Object.keys(override.body).reduce((newBody, key) => {
      newBody[key.charAt(0).toUpperCase() + key.slice(1)] = override.body[key];
      return newBody;
    }, {});

    body = jsonMerger.mergeObjects([body, override.body]);
  }

  const data = encodeUrlData(body);

  // Twilio API version 2010-04-01 Messages POST URL
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await axios.post(url, data, {
      auth: {
        username: accountSid,
        password: authToken,
      },
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Twilio WhatsApp API request timed out.",
    });

    return response.data;
  } catch (err) {
    handleError(err);
  }
};

export default send;
