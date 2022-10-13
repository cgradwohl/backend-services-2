import getPlainTemplates, { IPlainTemplates } from "~/lib/templates/plain";
import { IProviderWithTemplates } from "../types";

export type ViberProvider = IProviderWithTemplates<IPlainTemplates>;

const provider: ViberProvider = {
  getTemplates: getPlainTemplates,
};

export default provider;
