import getPlainTemplates, { IPlainTemplates } from "~/lib/templates/plain";
import send from "~/providers/messagemedia/send";
import { IProviderWithTemplates } from "~/providers/types";

const provider: IProviderWithTemplates<IPlainTemplates> = {
  getTemplates: getPlainTemplates,
};

export default provider;
