// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import nodemailer from "nodemailer";

import emailParser, { formatEmail } from "~/lib/email-parser";
import applyDomainVerification from "../apply-domain-verification";

import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    host: string;
    username: string;
    password: string;
    fromAddress: string;
  };

  if (!config.host || !config.host.length) {
    throw new ProviderConfigurationError("No Host specified.");
  }
  if (!config.username || !config.username.length) {
    throw new ProviderConfigurationError("No Username specified.");
  }
  if (!config.password || !config.password.length) {
    throw new ProviderConfigurationError("No Password specified.");
  }

  const { profile } = params;

  // All email addresses can be plain ‘sender@server.com’ or formatted ’“Sender Name” sender@server.com‘.
  // https://nodemailer.com/message/addresses/
  const parsedToEmail = emailParser(profile.email as string, "To Email");
  const parsedFromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(config.fromAddress, "From Email")[0];

  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");

  try {
    const transport = jsonMerger.mergeObjects([
      {
        auth: {
          pass: config.password,
          user: config.username,
        },
        host: config.host,
        connectionTimeout: DEFAULT_PROVIDER_TIMEOUT_MS,
        socketTimeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      },
      params.override?.config ?? {},
    ]);
    const smtp = nodemailer.createTransport(transport);

    // Verify SMTP connection configuration
    await smtp.verify();

    let body = {
      bcc: formatEmail(parsedBCCEmail),
      cc: formatEmail(parsedCCEmail),
      from: formatEmail(parsedFromEmail),
      html: templates.html,
      replyTo: formatEmail(parsedReplyToEmail),
      subject: templates.subject,
      text: templates.text,
      to: formatEmail(parsedToEmail),
    };

    if (params.override && params.override.body) {
      body = jsonMerger.mergeObjects([body, params.override.body]);
    }

    return await smtp.sendMail(body);
  } catch (e) {
    if (e.code && e.code === "ETIMEDOUT") {
      throw new RetryableProviderResponseError(e);
    }

    throw new ProviderResponseError(e.message);
  }
};

export default applyDomainVerification(send);
