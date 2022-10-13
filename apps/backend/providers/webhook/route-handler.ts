import { IProviderWithTemplates } from "../types";
import getWebhookTemplates from "~/lib/templates/webhook";

const provider: IProviderWithTemplates<{}> = {
  getTemplates: getWebhookTemplates,
};

export default provider;
