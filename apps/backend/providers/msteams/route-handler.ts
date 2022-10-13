import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{ msteams: "msteams" }> = {
  getTemplates: (template) => ({ msteams: template.msteamsRenderer() }),
};

export default provider;
