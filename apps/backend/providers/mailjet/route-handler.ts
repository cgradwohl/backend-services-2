import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type MailjetProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: MailjetProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
