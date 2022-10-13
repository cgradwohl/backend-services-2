import getPushTemplates, { IPushTemplates } from "~/lib/templates/push";

import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<IPushTemplates> = {
  getTemplates: getPushTemplates,
};

export default provider;
