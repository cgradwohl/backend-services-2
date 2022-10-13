import {
  encode as encodeEmailSubject,
  hasUnicode,
} from "~/lib/email-subject-encoding";
import { IProviderWithTemplates, ITemplates } from "~/providers/types";
import getEmailTemplates from "./email";
export interface IEmailTemplates extends ITemplates {
  bcc: "text";
  cc: "text";
  from: "text";
  html: "email" | "plain";
  replyTo: "text";
  subject: "text";
  text: "plain";
}

const createEmailSubject = (subject) => {
  if (!hasUnicode(subject)) {
    return subject;
  }

  // https://linear.app/trycourier/issue/C-3021/sendgrid-issue-with-double-quotes-with-curlyquotes
  subject = subject.replace(/"/g, '\\"');
  return encodeEmailSubject(subject);
};

const getSendgridEmailTemplates: IProviderWithTemplates<
  IEmailTemplates
>["getTemplates"] = (template, config, options) => {
  const { fromTextUnsafe } = template;
  const emailTemplates = getEmailTemplates(template, config, options);
  const { emailSubject } = config.email ?? ({} as any);

  const locales = options?.locales ?? undefined;
  const subject = config?.locale
    ? locales?.[config.locale]?.subject ?? emailSubject
    : emailSubject;

  return {
    ...emailTemplates,
    subject: fromTextUnsafe(subject, "(no subject)", createEmailSubject),
  };
};

export default getSendgridEmailTemplates;
