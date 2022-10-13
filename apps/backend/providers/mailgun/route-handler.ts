import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type MailgunProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: MailgunProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
