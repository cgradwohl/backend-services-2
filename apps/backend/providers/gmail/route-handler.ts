import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type GmailProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: GmailProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
