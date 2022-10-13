import axios from "axios";
import emailParser, { formatEmail } from "~/lib/email-parser";
import {
  handleSendError,
  ProviderConfigurationError,
} from "~/providers/errors";
import applyDomainVerification from "../apply-domain-verification";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = {
    apiKey: params.override?.config?.apiKey ?? params.config.apiKey,
    fromAddress:
      params.override?.config?.fromAddress ??
      params.config.fromAddress ??
      params.override?.config?.from ??
      templates.from,
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No 'API Key' specified.");
  }
  if (!config.fromAddress || !config.fromAddress.length) {
    throw new ProviderConfigurationError("No 'From Address' specified.");
  }

  const url =
    params.override?.config?.url ?? "https://api.mailersend.com/v1/email";

  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  const parsedFromEmail = emailParser(config.fromAddress, "From Email");
  const parsedToEmail = emailParser(params.profile.email as string, "To Email");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");
  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");

  const data = {
    from: {
      email: formatEmail(parsedFromEmail, false),
    },
    to: [
      {
        email: formatEmail(parsedToEmail, false),
      },
    ],
    bcc: [
      {
        email: formatEmail(parsedBCCEmail, false),
      },
    ],
    cc: [
      {
        email: formatEmail(parsedCCEmail, false),
      },
    ],
    reply_to: {
      email: formatEmail(parsedReplyToEmail, false),
    },
    subject: templates.subject,
    text: templates.text,
    html: templates.html,
  };

  try {
    const response = await axios({
      data,
      headers,
      method: "POST",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Mailersend API request timed out.",
      url,
    });

    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    handleSendError(error);
  }
};

export default applyDomainVerification(send);
