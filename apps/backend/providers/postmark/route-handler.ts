import getPostmarkEmailTemplates, {
  IEmailTemplates,
} from "~/lib/templates/postmark";

import { IProviderWithTemplates } from "../types";

export type PostmarkProvider = IProviderWithTemplates<IEmailTemplates>;

const provider: PostmarkProvider = {
  getTemplates: getPostmarkEmailTemplates,
};

export default provider;
