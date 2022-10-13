import getEmailTemplates, { IEmailTemplates } from "~/lib/templates/email";

import { IProviderWithTemplates } from "../types";

export type SparkPostProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: SparkPostProvider = {
  getTemplates: getEmailTemplates,
};

export default provider;
