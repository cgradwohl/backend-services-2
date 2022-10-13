// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import axios, { AxiosRequestConfig } from "axios";
import emailParser, { formatEmail } from "~/lib/email-parser";
import { ApiSendRequestOverrideChannel } from "~/types.public";
import applyDomainVerification from "../apply-domain-verification";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

interface IAmplyUser {
  email: string;
  name?: string;
}

interface IAmplyAttachments {
  content: string;
  type?: string;
  filename: string;
}

interface IAmplyBody {
  personalizations: Array<{
    to: IAmplyUser[];
    cc?: IAmplyUser[];
    bcc?: IAmplyUser[];
  }>;
  subject: string;
  from: IAmplyUser;
  reply_to?: IAmplyUser;
  content: Array<{
    type: string;
    value: string;
  }>;
  attachments?: IAmplyAttachments[];
}

const send: DeliveryHandler = async (params, templates) => {
  const accessToken =
    params.override?.config?.accessToken ?? params.config.accessToken;
  const fromEmail =
    params.override?.config?.fromEmail ?? params.config.fromEmail;
  const fromName = params.override?.config?.fromName ?? params.config.fromName;

  if (!accessToken || !accessToken.length) {
    throw new ProviderConfigurationError("No Access Token specified.");
  } else if (!fromEmail || !fromEmail.length) {
    throw new ProviderConfigurationError("No From Email specified.");
  }

  const { profile } = params;

  try {
    const parsedToEmail = emailParser(profile.email as string, "To Email");
    const payloadFromEmail =
      emailParser(templates.from, "From Email")[0] ||
      emailParser(fromEmail, "From Email")[0];

    const parsedCCEmail = emailParser(templates.cc, "Email CC");
    const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");

    let body: IAmplyBody = {
      personalizations: [
        {
          to: [
            {
              email: formatEmail(parsedToEmail),
            },
          ],
          ...(formatEmail(parsedBCCEmail) && {
            bcc: [
              {
                email: formatEmail(parsedBCCEmail),
              },
            ],
          }),
          ...(formatEmail(parsedCCEmail) && {
            cc: [
              {
                email: formatEmail(parsedCCEmail),
              },
            ],
          }),
        },
      ],
      from: {
        email: payloadFromEmail.email,
        name: fromName ?? payloadFromEmail.name,
      },
      subject: params.override?.config?.subject ?? templates?.subject ?? "",
      content: [
        {
          type: "text/html",
          value: templates.html ?? templates.text,
        },
      ],
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
        body.attachments = attachments.map((attachment) => ({
          type: attachment.contentType,
          content: Buffer.from(attachment.data, "base64").toString(),
          filename: attachment.filename,
        }));
      } catch (error) {
        throw new ProviderConfigurationError("Invalid Attachment Override.");
      }
    }

    if (params.override && params.override.body) {
      body = jsonMerger.mergeObjects([body, params.override.body]);
    }

    const url =
      params.override?.config?.url ?? "https://sendamply.com/api/v1/email";

    const options: AxiosRequestConfig = {
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: body,
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS ?? 10000,
    };

    const res = await axios.request(options);

    return {
      data: res.data,
      headers: res.headers,
      status: res.status,
      statusText: res.statusText,
    };
  } catch (e) {
    handleSendError(e);
  }
};

export default applyDomainVerification(send);
