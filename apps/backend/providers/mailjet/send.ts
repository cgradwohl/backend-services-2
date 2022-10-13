// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import axios from "axios";
import emailParser, { formatEmail } from "~/lib/email-parser";
import applyDomainVerification from "../apply-domain-verification";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

interface IMailJetBody {
  FromEmail: string;
  FromName: string;
  Subject: string;
  "Html-part": string;
  "Text-part": string;
  To: string;
  Headers?: {
    "Reply-To"?: string;
  };
  Cc: string;
  Bcc: string;
}

const send: DeliveryHandler = async (params, templates) => {
  const config = params.config as unknown as {
    publicKey: string;
    privateKey: string;
    fromEmail: string;
    fromName: string;
  };

  if (!config.publicKey || !config.publicKey.length) {
    throw new ProviderConfigurationError("No Public Key specified.");
  } else if (!config.privateKey || !config.privateKey.length) {
    throw new ProviderConfigurationError("No Private Key specified.");
  }

  const { profile } = params;

  try {
    const parsedToEmail = emailParser(profile.email as string, "To Email");
    const fromEmail =
      emailParser(templates.from, "From Email")[0] ||
      emailParser(config.fromEmail, "From Email")[0];

    const parsedReplyToEmail = emailParser(templates.replyTo, "Reply To");
    const parsedCCEmail = emailParser(templates.cc, "Email CC");
    const parsedBCCEmail = emailParser(templates.bcc, "Email BCC");
    let payload: IMailJetBody = {
      Bcc: formatEmail(parsedBCCEmail),
      Cc: formatEmail(parsedCCEmail),
      FromEmail: fromEmail.email,
      FromName: fromEmail.name,
      "Html-part": templates.html,
      Subject: templates.subject,
      "Text-part": templates.text,
      To: formatEmail(parsedToEmail),
      Headers: {
        "Reply-To": formatEmail(parsedReplyToEmail),
      },
    };

    if (params.override && params.override.body) {
      payload = jsonMerger.mergeObjects([payload, params.override.body]);
    }

    const res = await axios.post("https://api.mailjet.com/v3/send", payload, {
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS ?? 10000,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: config.publicKey,
        password: config.privateKey,
      },
    });

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
