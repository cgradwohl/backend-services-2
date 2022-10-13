import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type MailersendProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: MailersendProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
