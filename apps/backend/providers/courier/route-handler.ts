import getTemplates, { IInAppTemplates } from "~/lib/templates/in-app";

import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<IInAppTemplates> = {
  getTemplates,
};

export default provider;
