import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type SmtpProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: SmtpProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
