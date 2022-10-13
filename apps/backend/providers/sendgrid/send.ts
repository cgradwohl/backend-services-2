import { MailService } from "@sendgrid/mail";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import uuid from "uuid";

import emailParser from "~/lib/email-parser";
import { IConfigurationJson } from "~/types.api";
import applyDomainVerification from "../apply-domain-verification";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";
import { ISendgridBody, ISendGridConfig } from "./types";

const retryableStatuses = [400, 401, 403, 406, 415, 429];

const createEmailList = (parsedEmails) => {
  const emailList = parsedEmails
    .map((parsedEmail) => {
      if (!parsedEmail.email) {
        return;
      }

      return {
        email: parsedEmail.email,
        name: parsedEmail.name,
      };
    })
    .filter(Boolean);

  if (emailList.length === 0) {
    return undefined;
  }

  return emailList;
};

function assertSendGridConfig(
  config: IConfigurationJson
): asserts config is ISendGridConfig {
  if (config.provider !== "sendgrid") {
    throw new Error(
      `Incorrect Configuration for sendgrid. Received ${config.provider}.`
    );
  }

  if (
    !config.apiKey ||
    typeof config.apiKey !== "string" ||
    !config.apiKey.length
  ) {
    throw new ProviderConfigurationError("No API Key specified.");
  }
}

const send: DeliveryHandler = async (params, templates) => {
  assertSendGridConfig(params.config);

  const { config, profile } = params;
  const parsedToEmail = emailParser(profile.email as string, "To Email");

  const fromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(config.fromAddress, "From Email")[0];

  const [replyToEmail] = emailParser(templates.replyTo, "Reply To");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");

  const trackingId = uuid.v4();
  const sendgrid = new MailService();
  sendgrid.setApiKey(params?.override?.config?.apiKey ?? config.apiKey);
  sendgrid.setTimeout(DEFAULT_PROVIDER_TIMEOUT_MS);

  let body: ISendgridBody = {
    bcc: createEmailList(parsedBCCEmail),
    cc: createEmailList(parsedCCEmail),
    custom_args: {
      "courier-tracking-id": trackingId,
    },
    from: {
      email: fromEmail.email,
      name: fromEmail.name,
    },
    html: templates.html,
    subject: templates.subject,
    text: templates.text,
    to: createEmailList(parsedToEmail),
  };

  if (replyToEmail) {
    body.reply_to = {
      email: replyToEmail.email,
      name: replyToEmail.name,
    };
  }

  if (params?.override?.body) {
    body = jsonMerger.mergeObjects([body, params.override.body]);
  }

  const { html, ...requestBody } = body;
  const providerRequest = {
    body: requestBody,
    config: {
      apiKey: params?.override?.config?.apiKey ?? config.apiKey,
    },
  };

  try {
    const res = await sendgrid.send(body);

    return {
      "courier-tracking-id": trackingId,
      "x-message-id": res[0].headers["x-message-id"],
      // tslint:disable-next-line: object-literal-sort-keys
      providerRequest,
      providerResponse: res[0],
    };
  } catch (err) {
    const code = err?.code ?? err?.response?.status;

    // SendGrid only documents error statuses 400, 401, 403.
    // Assuming > 500 is retryable.
    if (retryableStatuses.includes(code) || code >= 500) {
      throw new RetryableProviderResponseError(err);
    }

    throw new ProviderResponseError(err, null, providerRequest);
  }
};

export default applyDomainVerification(send);
