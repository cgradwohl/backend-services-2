import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type AwsSes = IProviderWithTemplates<IEmailTemplates>;

const provider: AwsSes = {
  getTemplates: getEmailTemplates,
};

export default provider;
