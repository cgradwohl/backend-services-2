// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import axios from "axios";

import emailParser from "~/lib/email-parser";
import applyDomainVerification from "../apply-domain-verification";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    apiKey: string;
    fromAddress: string;
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  if (!config.fromAddress || !config.fromAddress.length) {
    throw new ProviderConfigurationError("No from address specified.");
  }

  const { profile } = params;
  const [toEmail] = emailParser(profile.email as string, "To Email");
  const fromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(config.fromAddress, "From Email")[0];
  const [replyToEmail] = emailParser(templates.replyTo, "Reply To");

  // sparkpost doesn't seem to accept multiple bcc based on how they do cc
  const [ccEmail] = emailParser(templates.cc, "Email CC");
  const [bccEmail] = emailParser(templates.bcc, "Email BCC");

  try {
    let payload = {
      content: {
        from: fromEmail && {
          email: fromEmail.email,
          name: fromEmail.name,
        },
        html: templates.html,
        replyTo: replyToEmail && replyToEmail.email,
        subject: templates.subject,
        text: templates.text,
      },
      headers: undefined,
      options: {
        transactional: true,
      },
      recipients: [
        {
          address: {
            email: toEmail.email,
            name: toEmail.name,
          },
        },
        ccEmail && {
          address: {
            email: ccEmail.email,
            header_to: toEmail.email,
            name: ccEmail.name,
          },
        },
        bccEmail && {
          address: {
            email: bccEmail.email,
            header_to: toEmail.email,
            name: bccEmail.name,
          },
        },
      ].filter(Boolean),
    };

    // https://www.sparkpost.com/docs/faq/cc-bcc-with-rest-api/
    if (ccEmail) {
      payload.headers = payload.headers || {};
      payload.headers = {
        ...payload.headers,
        CC: ccEmail.email,
      };
    }

    if (params.override && params.override.body) {
      payload = jsonMerger.mergeObjects([payload, params.override.body]);
    }

    const response = await axios({
      data: payload,
      headers: {
        Authorization: config.apiKey,
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Sparkpost API request timed out.",
      url: "https://api.sparkpost.com/api/v1/transmissions",
    });
    return {
      data: response.data,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (err) {
    handleSendError(err);
  }
};

export default applyDomainVerification(send);
