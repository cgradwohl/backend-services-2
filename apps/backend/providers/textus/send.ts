import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

import { ProviderConfigurationError } from "../errors";
import { handleSendError } from "../errors";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    authToken: string;
    from: string;
    email: string;
  };

  if (!config.authToken || !config.authToken.length) {
    throw new ProviderConfigurationError("No Auth Token specified.");
  }

  const { override, profile } = params;

  const authToken = override?.config?.authToken ?? config.authToken;
  const from = override?.config?.from ?? config.from;
  const email = override?.config?.email ?? config.email;

  if (!email && !from) {
    throw new ProviderConfigurationError(
      "Either from number or email is required."
    );
  }

  let body: any = {
    body: templates.plain,
    to: profile.phone_number as string,
  };

  if (from) {
    body = { ...body, from };
  }

  if (email) {
    body = { ...body, email };
  }

  if (override?.body) {
    body = jsonMerger.mergeObjects([body, override.body]);
  }

  const url = "https://next.textus.com/messages";

  try {
    const response = await axios.post(url, body, {
      headers: {
        Accept: "application/vnd.textus+jsonld",
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/vnd.textus+jsonld",
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "TextUs API request timed out.",
    });

    return response.data;
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
