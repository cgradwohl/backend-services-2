import AWS, { AWSError } from "aws-sdk";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import emailParser, { formatEmail } from "~/lib/email-parser";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";

import { IConfigurationJson } from "~/types.api";
import { ApiSendRequestOverrideChannel } from "~/types.public";
import applyDomainVerification from "../apply-domain-verification";
import { DeliveryHandler } from "../types";
import { IAwsSesConfig, regions } from "./types";
import isNil from "~/lib/is-nil";

function assertAwsSesConfig(
  config: IConfigurationJson
): asserts config is IAwsSesConfig {
  if (config.provider !== "aws-ses") {
    throw new Error(
      `Incorrect Configuration for aws-ses. Received ${config.provider}.`
    );
  }

  if (
    !config.accessKeyId ||
    typeof config.accessKeyId !== "string" ||
    !config.accessKeyId.length
  ) {
    throw new ProviderConfigurationError("No Access Key ID specified.");
  } else if (
    !config.secretAccessKey ||
    typeof config.secretAccessKey !== "string" ||
    !config.secretAccessKey.length
  ) {
    throw new ProviderConfigurationError("No Secret Key specified.");
  }

  if (config?.region) {
    const sesConfig = config as IAwsSesConfig;
    const region =
      typeof sesConfig?.region === "string"
        ? sesConfig.region
        : sesConfig?.region?.value;

    if (!region) {
      throw new ProviderConfigurationError("Invalid region type");
    }

    if (!regions.includes(region)) {
      throw new ProviderConfigurationError(
        `Specified region ${region} is invalid. See https://docs.aws.amazon.com/general/latest/gr/rande.html#region-names-codes.`
      );
    }
  }
}

// Sends a transactional email on via Amzn Access Id and Key.
// Supports override of Access Key Id and Secret Access Key
const send: DeliveryHandler = async (params, templates) => {
  assertAwsSesConfig(params.config);

  const { config, profile } = params;
  const accessKeyId =
    params?.override?.config?.accessKeyId ?? config.accessKeyId;
  const secretAccessKey =
    params?.override?.config?.secretAccessKey ?? config.secretAccessKey;
  const configRegion =
    typeof config?.region === "string" ? config.region : config?.region?.value;
  const region =
    params?.override?.config?.region ?? configRegion ?? "us-east-1";

  const parsedToEmail = emailParser(profile.email as string, "To Email");
  const fromEmail =
    emailParser(templates.from, "From Email")[0] ??
    emailParser(config.fromAddress, "From Email")[0];

  const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
  const parsedCCEmail = emailParser(templates.cc, "Email CC");
  const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");

  const formattedReplyTo = formatEmail(parsedReplyToEmail);

  const boundary = `----=_Part${Math.random().toString().substr(2)}`;
  const alternativeBoundary = `----=_Part${Math.random().toString().substr(2)}`;
  // https://docs.aws.amazon.com/ses/latest/DeveloperGuide/header-fields.html
  // https://stackoverflow.com/questions/27446357/how-to-add-cc-and-bcc-in-amazon-ses-sendrawemail
  // https://stackoverflow.com/questions/3902455/mail-multipart-alternative-vs-multipart-mixed
  let rawMessage = [
    `From: ${formatEmail(fromEmail)}`,
    `To: ${formatEmail(parsedToEmail)}`,
    formatEmail(parsedCCEmail, false)
      ? `Cc: ${formatEmail(parsedCCEmail, false)}`
      : undefined,
    formatEmail(parsedBCCEmail, false)
      ? `Bcc: ${formatEmail(parsedBCCEmail, false)}`
      : undefined,
    `Subject: ${templates.subject}`,
    `MIME-Version: 1.0`,
    formattedReplyTo ? `Return-Path: ${formattedReplyTo}` : undefined, // Will be replaced by SES
    `Content-Type: multipart/mixed; boundary="${boundary}"`, // For sending both plaintext & aattachments
    `\n`,
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`, // For sending both plaintext & html content
    `\n`,
    `--${alternativeBoundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    `\n`,
    templates.text,
    `\n`,
    `--${alternativeBoundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    `\n`,
    templates.html,
    `\n`,
    `--${alternativeBoundary}--`,
    `\n`,
  ].filter(Boolean);

  const channelOverrides =
    params?.channelOverride as ApiSendRequestOverrideChannel["channel"]["email"];
  const channelAttachments = channelOverrides?.attachments ?? [];

  const providerAttachments = params?.override?.attachments ?? [];
  const attachments = [
    ...providerAttachments,
    ...channelAttachments.filter((attachment) =>
      providerAttachments.some(
        // do not add duplicates
        ({ filename }) => filename !== attachment.filename
      )
    ),
  ];

  // https://stackoverflow.com/questions/49364199/how-can-send-pdf-attachment-in-node-aws-sdk-sendrawemail-function
  if (attachments.length) {
    let addBoundary = false;
    for (const attachment of attachments) {
      if (!isNil(attachment)) {
        addBoundary = true;
        rawMessage = rawMessage.concat([
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          `Content-Transfer-Encoding: base64`,
          `\n`,
          attachment.data?.replace(/([^\0]{76})/g, "$1\n") ?? "",
          `\n`,
        ]);
      }
    }

    if (addBoundary) {
      rawMessage.push(`--${boundary}--`);
      rawMessage.push(`\n`);
    }
  }

  // See https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html.
  let body: AWS.SES.SendRawEmailRequest = {
    RawMessage: {
      Data: rawMessage.join("\n"),
    },
    Source: fromEmail.email,
  };

  // Allow them to override RawMessage and Source
  if (params.override && params.override.body) {
    body = jsonMerger.mergeObjects([body, params.override.body]);
  }

  try {
    const ses = new AWS.SES({
      accessKeyId,
      apiVersion: "2010-12-01",
      region,
      secretAccessKey,
    });
    const res = await ses.sendRawEmail(body).promise();

    return res;
  } catch (err) {
    if ((err as AWSError)?.retryable) {
      throw new RetryableProviderResponseError(err);
    }
    throw new ProviderResponseError(err);
  }
};

export default applyDomainVerification(send);
