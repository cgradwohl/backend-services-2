import { encode as encodeEmailSubject } from "~/lib/email-subject-encoding";
import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IEmailTemplates extends ITemplates {
  bcc: "text";
  cc: "text";
  from: "text";
  html: "email" | "plain";
  replyTo: "text";
  subject: "text";
  text: "plain";
}

const getEmailTemplates: IProviderWithTemplates<
  IEmailTemplates
>["getTemplates"] = (template, config, options) => {
  const locales = options?.locales ?? undefined;
  const { emailRenderer, fromTextUnsafe, plainRenderer } = template;
  const {
    emailBCC,
    emailCC,
    emailFrom,
    emailReplyTo,
    emailSubject,
    renderPlainText,
  } = config.email ?? ({} as any);

  const plainTextHtmlRenderer = plainRenderer({
    defaultText: "No Text Available",
    scope: "plain-html",
  });

  const subject = config?.locale
    ? locales?.[config.locale]?.subject ?? emailSubject
    : emailSubject;

  return {
    bcc: fromTextUnsafe(emailBCC),
    cc: fromTextUnsafe(emailCC),
    from: fromTextUnsafe(emailFrom),
    html: renderPlainText ? plainTextHtmlRenderer : emailRenderer(),
    replyTo: fromTextUnsafe(emailReplyTo),
    subject: fromTextUnsafe(subject, "(no subject)", encodeEmailSubject),
    text: plainRenderer({ defaultText: "No Text Available" }),
  };
};

export default getEmailTemplates;
