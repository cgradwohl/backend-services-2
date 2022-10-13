import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type AmplyProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: AmplyProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
