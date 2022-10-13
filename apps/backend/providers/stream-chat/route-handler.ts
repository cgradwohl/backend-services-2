import getPlainTemplates, { IPlainTemplates } from "~/lib/templates/plain";
import { IProviderWithTemplates } from "~/providers/types";

const provider: IProviderWithTemplates<IPlainTemplates> = {
  getTemplates: getPlainTemplates,
};

export default provider;
