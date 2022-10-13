import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type MandrillProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: MandrillProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
