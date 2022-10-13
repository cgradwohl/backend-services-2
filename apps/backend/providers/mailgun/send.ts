import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import emailParser, { formatEmail } from "~/lib/email-parser";
import applyDomainVerification from "~/providers/apply-domain-verification";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import { createFormData } from "~/providers/mailgun/create-form-data";
import { DeliveryHandler } from "~/providers/types";
import { ApiSendRequestOverrideChannel } from "~/types.public";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    domain: string;
    apiKey: string;
    fromAddress: string;
    host: string;
  };

  const apiKey = params?.override?.config?.apiKey ?? config.apiKey;
  const domain = params?.override?.config?.domain ?? config.domain;
  const host = params?.override?.config?.host ?? "api.mailgun.net";
  const fromAddress =
    params?.override?.config?.fromAddress ?? config.fromAddress;

  const { profile } = params;

  if (!domain || !domain.length) {
    throw new ProviderConfigurationError("No Domain specified.");
  }

  if (!apiKey || !apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  }

  const parsedDomain = domain.replace("https://api.mailgun.net/v3/", "");

  const mailgunConfig = {
    apiKey: (apiKey || "").trim(),
    domain: (parsedDomain || "").trim(),
    host: (host || "").trim(),
  };

  const parsedToEmail = emailParser(profile.email as string, "To Email");
  const fromEmail =
    emailParser(templates.from, "From Email")[0] ||
    emailParser(fromAddress, "From Email")[0];

  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
  const parsedCCToEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCToEmail = emailParser(templates.bcc, "Email BCC");

  let body: any = {
    from: formatEmail(fromEmail),
    "h:Reply-To": formatEmail(parsedReplyToEmail),
    html: templates.html,
    subject: templates.subject,
    text: templates.text,
    to: formatEmail(parsedToEmail),
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
      body.attachment = attachments.map((attachment) => ({
        contentType: attachment.contentType,
        data: Buffer.from(attachment.data, "base64"),
        filename: attachment.filename,
      }));
    } catch (error) {
      throw new ProviderConfigurationError("Invalid Attachment Override.");
    }
  }

  if (parsedCCToEmail.length) {
    body.cc = formatEmail(parsedCCToEmail);
  }

  if (parsedBCCToEmail.length) {
    body.bcc = formatEmail(parsedBCCToEmail);
  }

  if (params.override && params.override.body) {
    body = jsonMerger.mergeObjects([body, params.override.body]);
  }

  try {
    const formData = createFormData(body);
    const formHeaders = formData?.getHeaders();

    const url = `https://${mailgunConfig.host}/v3/${mailgunConfig.domain}/messages`;

    const response = await axios.post(url, formData, {
      auth: {
        password: mailgunConfig.apiKey,
        username: "api",
      },
      headers: { ...formHeaders },
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Mailgun API request timed out.",
    });

    if (typeof response.data === "string") {
      throw new ProviderResponseError(
        `Check mailgun configurations, ${response.data}`
      );
    }

    return response.data;
  } catch (err) {
    const status = err?.response?.status ?? 500;
    const errorDetails = err.response?.data?.message ?? err;
    // 404 Item could not be found
    // 413 Request too large
    if ([403, 404, 413].includes(status)) {
      throw new ProviderResponseError(errorDetails);
    }
    // and https://documentation.mailgun.com/en/latest/api-intro.html#errors
    if ([400, 401, 402].includes(status) || status >= 500) {
      throw new RetryableProviderResponseError(errorDetails);
    }

    throw err;
  }
};

export default applyDomainVerification(send);
