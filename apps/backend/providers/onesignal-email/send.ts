import axios from "axios";

import emailParser from "~/lib/email-parser";
import applyDomainVerification from "../apply-domain-verification";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

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
  try {
    const client = axios.create({
      baseURL: "https://onesignal.com/api/v1",
      headers: {
        Authorization: `Basic ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "OneSignal Email API request timed out.",
    });

    const body: {
      app_id: string;
      email_body: string;
      email_subject: string;
      include_email_tokens?: string[];
    } = {
      app_id: config.appId,
      email_body: templates.html,
      email_subject: templates.subject,
    };

    if (profile.email) {
      const parsedToEmail = emailParser(profile.email as string, "To Email");
      body.include_email_tokens = parsedToEmail.map(
        (parsedEmail) => parsedEmail.email
      );
    }

    const res = await client.post("/notifications", body);

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

export default applyDomainVerification(send);
