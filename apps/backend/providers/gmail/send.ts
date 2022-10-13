import axios from "axios";
import { encode } from "~/lib/base64";
import { list, replace } from "~/lib/configurations-service";
import emailParser, { formatEmail } from "~/lib/email-parser";
import getTenantInfo from "~/lib/get-tenant-info";
import resolveOverrides from "./resolve-overrides";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";
import applyDomainVerification from "../apply-domain-verification";
// TODO: figure out GMail retryable codes, 5xx, no 4xx for now
const retryableStatuses = [429, 500, 501];

const gmailSend = async ({
  access_token,
  bcc,
  cc,
  email,
  fromEmail,
  fromName,
  html,
  override,
  replyTo,
  subject,
  text,
}) => {
  try {
    const parsedToEmail = emailParser(email as string, "To Email");
    const parsedFromEmail = emailParser(fromEmail, "From Email")[0];

    const parsedReplyToEmail = emailParser(replyTo, "Reply To");
    const parsedCCEmail = emailParser(cc, "Email CC");
    const parsedBCCEmail = emailParser(bcc, "Email BCC");

    const formattedReplyTo = formatEmail(parsedReplyToEmail);

    const boundary = `----=_Part${Math.random().toString().substr(2)}`;
    const alternativeBoundary = `----=_Part${Math.random()
      .toString()
      .substr(2)}`;

    const rawMessage = [
      fromName
        ? `From: "${fromName}" <${formatEmail(parsedFromEmail)}>`
        : `From: ${formatEmail(parsedFromEmail)}`,
      `To: ${formatEmail(parsedToEmail)}`,
      formatEmail(parsedCCEmail, false)
        ? `Cc: ${formatEmail(parsedCCEmail, false)}`
        : undefined,
      formatEmail(parsedBCCEmail, false)
        ? `Bcc: ${formatEmail(parsedBCCEmail, false)}`
        : undefined,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      formattedReplyTo ? `Reply-To: ${formattedReplyTo}` : undefined,
      `Content-Type: multipart/mixed; boundary="${boundary}"`, // For sending both plaintext & aattachments
      `\n`,
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`, // For sending both plaintext & html content
      `\n`,
      `--${alternativeBoundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      `\n`,
      text,
      `\n`,
      `--${alternativeBoundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      `\n`,
      html,
      `\n`,
      `--${alternativeBoundary}--`,
      `\n`,
    ].filter(Boolean);

    const rawMessageString = encode(rawMessage.join("\n"));

    const response = await axios({
      data: {
        raw: rawMessageString,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
        ...(override?.headers ?? {}),
      },
      method: override?.method ?? "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "Gmail API request timed out.",
      url:
        override?.url ??
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    });

    return { response };
  } catch (error) {
    return { error };
  }
};

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
}
const fetchAccessToken = async (
  refresh_token: string,
  client_id: string,
  client_secret: string
) => {
  const res = await axios.post<RefreshTokenResponse>(
    `https://oauth2.googleapis.com/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token&refresh_token=${refresh_token}`
  );

  return res.data.access_token;
};

const send: DeliveryHandler = async (params, templates) => {
  // TODO: add assertion function
  const { config, profile, tenantId, override } = params;

  const access_token =
    params.override?.config?.access_token ?? params.config.access_token;
  if (!access_token || !access_token.length) {
    throw new ProviderConfigurationError("No Access Token present.");
  }

  const tenantInfo = getTenantInfo(tenantId);

  const resolvedOverrides = resolveOverrides(
    templates.bcc,
    templates.cc,
    config.fromName,
    templates.replyTo,
    templates.subject,
    templates.text,
    override
  );
  // optimistically make send api call stored access token
  try {
    const { error, response } = await gmailSend({
      access_token: config.access_token,
      email: profile.email,
      fromEmail: config.fromEmail,
      html: templates.html,
      override,
      ...resolvedOverrides,
    });

    // Keep the first error in case overrides contain authorization.
    // Then, we want to throw this error not the block scoped error in the if call to fetch token
    const initialError = error;

    if (!error) {
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      };
    }

    if (error?.response?.status === 401) {
      // If they provide an override in authorization i.e. access_token, don't fetch new access_token.
      // Instead, throw error that access token is expired
      if (override?.headers?.Authorization) {
        throw new ProviderResponseError(initialError, null);
      }
      const token = await fetchAccessToken(
        config.refresh_token as string,
        process.env.GOOGLE_SEND_PROVIDER_CLIENT_ID,
        process.env.GOOGLE_SEND_PROVIDER_CLIENT_SECRET
      );

      const configs = await list({ tenantId: tenantInfo.tenantId });

      // filter out gmail providers, currently there is only one, but we need to support many
      const { id: configId, json: configJson } = configs.objects.find(
        ({ json }) => json.provider === "gmail"
      ) ?? { id: undefined };

      if (tenantInfo.environment === "test" && configJson?.test !== undefined) {
        await replace(
          {
            id: configId,
            tenantId: tenantInfo.tenantId,
            userId: params.tenant.owner,
          },
          {
            json: {
              ...config,
              test: {
                ...config.test,
                access_token: token,
              },
            },
            title: "Default Configuration",
          }
        );
      } else {
        await replace(
          {
            id: configId,
            tenantId: tenantInfo.tenantId,
            userId: params.tenant.owner,
          },
          {
            json: {
              ...config,
              access_token: token,
            },
            title: "Default Configuration",
          }
        );
      }

      const { error, response } = await gmailSend({
        access_token: token,
        bcc: templates.bcc,
        cc: templates.cc,
        email: profile.email,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        html: templates.html,
        override,
        replyTo: templates.replyTo,
        subject: templates.subject,
        text: templates.text,
      });

      if (!error) {
        return {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
        };
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  } catch (error) {
    const code = error?.code ?? error?.response?.status;

    // Assuming > 500 is retryable.
    if (retryableStatuses.includes(code) || code >= 500) {
      throw new RetryableProviderResponseError(error);
    }

    throw new ProviderResponseError(error, null);
  }
};

// NOTE: Test was passing until I fixed the async/await which made it properly fail
export default applyDomainVerification(send);
