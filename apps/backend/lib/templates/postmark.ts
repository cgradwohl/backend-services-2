import { encode as encodeEmailSubject } from "~/lib/email-subject-encoding";
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

const createEmailSubject = (subject: string) => {
  // replace fancy single and double quotation marks
  subject = subject
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  return encodeEmailSubject(subject, 78);
};

const getPostmarkEmailTemplates: IProviderWithTemplates<IEmailTemplates>["getTemplates"] =
  (template, config, options) => {
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

export default getPostmarkEmailTemplates;
