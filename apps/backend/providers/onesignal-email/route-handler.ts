import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type OneSignalEmailProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: OneSignalEmailProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
