import getPlainTemplates, { IPlainTemplates } from "~/lib/templates/plain";

import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<IPlainTemplates> = {
  getTemplates: getPlainTemplates,
};

export default provider;
