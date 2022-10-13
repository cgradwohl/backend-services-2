import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import emailParser, { formatEmail } from "~/lib/email-parser";
import applyDomainVerification from "~/providers/apply-domain-verification";
import {
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import { ProviderConfigurationError } from "~/providers/errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "~/providers/lib/constants";
import { ApiSendRequestOverrideChannel } from "~/types.public";
import { DeliveryHandler } from "../types";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

interface PostmarkData {
  To: string;
  SubmittedAt: Date;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

const DEFAULT_URL = "https://api.postmarkapp.com/email";

export const handleError = (err: AxiosError) => {
  // https://postmarkapp.com/developer/api/overview#response-codes
  if ([429, 500, 503].includes(err.response?.status)) {
    throw new RetryableProviderResponseError(err);
  }

  throw new ProviderResponseError(err);
};

const send: DeliveryHandler = async (params, templates) => {
  const config = {
    apiKey: params.override?.config?.apiKey ?? params.config.apiKey,
    fromAddress:
      params.override?.config?.fromAddress ?? params.config.fromAddress,
    MessageStream:
      params.override?.config?.MessageStream ?? params.config.MessageStream,
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const { profile } = params;

  // Docs:  https://postmarkapp.com/developer/api/email-api
  // To include a name, use the format "Full Name sender@domain.com" for the address.

  const parsedToEmail = emailParser(profile.email as string, "To Email");
  const fromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(config.fromAddress, "From Email")[0];

  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");

  const hasPostmarkTemplate =
    params?.override?.body?.TemplateId ||
    params?.override?.body?.TemplateAlias ||
    params?.override?.body?.TemplateModel;

  let body: Record<string, unknown> = {
    Bcc: formatEmail(parsedBCCEmail, false),
    Cc: formatEmail(parsedCCEmail, false),
    From: formatEmail(fromEmail, false),
    ...(!hasPostmarkTemplate && {
      HtmlBody: templates.html,
      ReplyTo: formatEmail(parsedReplyToEmail, false),
      Subject: templates.subject,
      TextBody: templates.text,
    }),
    To: formatEmail(parsedToEmail, false),
    ...(config && config.MessageStream
      ? { MessageStream: config.MessageStream }
      : {}),
  };

  const channelOverrides =
    params?.channelOverride as ApiSendRequestOverrideChannel["channel"]["email"];
  const channelAttachments = channelOverrides?.attachments ?? [];

  const providerAttachments = params?.override?.attachments ?? [];
  const attachments = [
    ...providerAttachments,
    ...channelAttachments.filter((channelAttachment) => {
      // if the channel attachment is not a duplicate, then add it
      if (
        !providerAttachments.some(
          (providerAttachment) =>
            providerAttachment.filename === channelAttachment.filename
        )
      ) {
        return channelAttachment;
      }
    }),
  ];

  if (attachments.length) {
    try {
      body = {
        ...body,
        Attachments: attachments.map((attachment) => ({
          ContentType: attachment.contentType,
          Content: attachment.data,
          Name: attachment.filename,
        })),
      };
    } catch (error) {
      throw new ProviderConfigurationError("Invalid Attachment Override.");
    }
  }

  if (params.override && params.override.body) {
    body = jsonMerger.mergeObjects([body, params.override.body]);
  }

  const url = params.override?.config?.url ?? DEFAULT_URL;

  const options: AxiosRequestConfig = {
    method: "POST",
    url,
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": `${(config.apiKey as string).trim()}`,
    },
    data: body,
    timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
    timeoutErrorMessage: "Postmark API Request timed out",
  };

  try {
    const { status, data, headers, statusText } = (await axios(
      options
    )) as AxiosResponse<PostmarkData>;
    return {
      status,
      data,
      headers,
      statusText,
    };
  } catch (err) {
    handleError(err);
  }
};

export default applyDomainVerification(send);
