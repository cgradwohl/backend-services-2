import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/sendgrid";

import { IProviderWithTemplates } from "../types";

export type SendGridProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: SendGridProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
