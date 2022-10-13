import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import emailParser, { formatEmail } from "~/lib/email-parser";
import applyDomainVerification from "../apply-domain-verification";

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DeliveryHandler } from "../types";
import { IMandrillBody } from "./types";

const makeEmailList = (parsedEmails, type) => {
  return parsedEmails
    .map(
      (parsedEmail) =>
        parsedEmail.email && {
          email: parsedEmail.email,
          name: parsedEmail.name,
          type,
        }
    )
    .filter(Boolean);
};

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    apiKey: string;
    fromAddress: string;
    fromName: string;
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  if (!config.fromAddress || !config.fromAddress.length) {
    throw new ProviderConfigurationError("No from address specified.");
  }

  if (!config.fromName || !config.fromName.length) {
    throw new ProviderConfigurationError("No from name specified.");
  }

  const { profile } = params;
  const parsedToEmail = emailParser(profile.email as string, "To Email");
  const fromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(config.fromAddress, "From Email")[0];

  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");
  const toEmails = makeEmailList(parsedToEmail, "to");
  const ccEmails = makeEmailList(parsedCCEmail, "cc");
  const bccEmails = makeEmailList(parsedBCCEmail, "bcc");

  const message: IMandrillBody = {
    from_email: fromEmail.email,
    from_name: fromEmail.name || config.fromName,
    html: templates.html,
    subject: templates.subject,
    text: templates.text,
    to: [...toEmails, ...ccEmails, ...bccEmails].filter(Boolean),
  };

  const formattedReplyToEmail = formatEmail(parsedReplyToEmail);
  if (formattedReplyToEmail) {
    message.headers = {
      "Reply-To": formattedReplyToEmail,
    };
  }

  let mergedData = {
    async: false,
    key: config.apiKey,
    message,
  };
  if (params.override && params.override.body) {
    mergedData = jsonMerger.mergeObjects([mergedData, params.override.body]);
  }

  try {
    const res = await axios({
      data: mergedData,
      method: "post",
      timeout: 20000,
      timeoutErrorMessage: "Mandrill API request timed out.",
      url: "https://mandrillapp.com/api/1.0/messages/send.json",
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

export default applyDomainVerification(send);
